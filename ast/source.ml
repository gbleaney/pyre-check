(* Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree. *)

open Core
open Pyre

type mode =
  | Debug
  | Strict
  | Unsafe
  | Declare
  | Infer
[@@deriving compare, eq, show, sexp, hash]

type local_mode =
  | Debug
  | Strict
  | Unsafe
  | Declare
  | PlaceholderStub
[@@deriving compare, eq, show, sexp, hash]

module Metadata = struct
  type t = {
    autogenerated: bool;
    local_mode: local_mode Node.t option;
    unused_local_modes: local_mode Node.t list;
    ignore_codes: int list;
    ignore_lines: Ignore.t list;
    version: int;
    number_of_lines: int; [@compare.ignore]
    raw_hash: int; [@compare.ignore]
  }
  [@@deriving compare, eq, show, hash, sexp]

  let is_placeholder_stub local_mode =
    match local_mode with
    | Some { Node.value = PlaceholderStub; _ } -> true
    | _ -> false


  let create_for_testing
      ?(autogenerated = false)
      ?(local_mode = Node.create ~location:Location.Reference.any Debug)
      ?(unused_local_modes = [])
      ?(ignore_codes = [])
      ?(ignore_lines = [])
      ?(version = 3)
      ?(raw_hash = -1)
      ?(number_of_lines = 0)
      ()
    =
    {
      autogenerated;
      local_mode = Some local_mode;
      unused_local_modes;
      ignore_codes;
      ignore_lines;
      number_of_lines;
      version;
      raw_hash;
    }


  let default_with_suppress_regex =
    Str.regexp "^ ?# *pyre-ignore-all-errors\\[\\([0-9]+, *\\)*\\([0-9]+\\)\\] *$"


  let ignore_code_regex = Str.regexp "pyre-\\(ignore\\|fixme\\)\\[\\([0-9, ]+\\)\\]"

  let ignore_location_regex = Str.regexp "\\(pyre-\\(ignore\\|fixme\\)\\|type: ignore\\)"

  let is_pyre_comment comment_substring line =
    let comment_regex = Str.regexp ("^ ?# *" ^ comment_substring ^ " *$") in
    Str.string_match comment_regex line 0


  let parse ~qualifier lines =
    let is_python_2_shebang line =
      String.is_prefix ~prefix:"#!" line && String.is_substring ~substring:"python2" line
    in
    let is_debug = is_pyre_comment "pyre-debug" in
    let is_strict = is_pyre_comment "pyre-strict" in
    let is_unsafe = is_pyre_comment "pyre-unsafe" in
    (* We do not fall back to declarative mode on a typo when attempting to only suppress certain
       errors. *)
    let is_declare = is_pyre_comment "pyre-ignore-all-errors" in
    let is_default_with_suppress line = Str.string_match default_with_suppress_regex line 0 in
    let is_placeholder_stub = is_pyre_comment "pyre-placeholder-stub" in
    let collect
        index
        (version, local_mode, unused_local_modes, ignore_codes, ignore_lines, autogenerated)
        line
      =
      let current_line_mode =
        let location =
          let length = String.length line in
          let content_length = String.length (String.strip line) in
          let start = { Location.line = index + 1; column = length - content_length } in
          let stop = { Location.line = index + 1; column = length } in
          { Location.path = qualifier; start; stop }
        in
        if is_debug line then
          Some (Node.create ~location Debug)
        else if is_strict line then
          Some (Node.create ~location Strict)
        else if is_unsafe line then
          Some (Node.create ~location Unsafe)
        else if is_declare line then
          Some (Node.create ~location Declare)
        else if is_placeholder_stub line then
          Some (Node.create ~location PlaceholderStub)
        else
          None
      in
      let ignores =
        let line_index = index + 1 in
        let create_ignore ~line ~kind =
          let codes =
            try
              Str.search_forward ignore_code_regex line 0 |> ignore;
              Str.matched_group 2 line
              |> Str.split (Str.regexp "[^0-9]+")
              |> List.map ~f:Int.of_string
            with
            | Not_found -> []
          in
          let location =
            let start_column = Str.search_forward ignore_location_regex line 0 in
            let end_column = String.length line in
            let start = { Location.line = line_index; column = start_column } in
            let stop = { Location.line = line_index; column = end_column } in
            { Location.path = qualifier; start; stop }
          in
          Ignore.create ~ignored_line:line_index ~codes ~location ~kind
        in
        let contains_outside_quotes ~substring line =
          let find_substring index characters =
            String.is_substring ~substring characters && index mod 2 = 0
          in
          String.split_on_chars ~on:['\"'; '\''] line |> List.existsi ~f:find_substring
        in
        let ignore_lines =
          let kind =
            if
              contains_outside_quotes ~substring:"pyre-ignore" line
              && not (contains_outside_quotes ~substring:"pyre-ignore-all-errors" line)
            then
              Some Ignore.PyreIgnore
            else if contains_outside_quotes ~substring:"pyre-fixme" line then
              Some Ignore.PyreFixme
            else if contains_outside_quotes ~substring:"type: ignore" line then
              Some Ignore.TypeIgnore
            else
              None
          in
          kind
          >>| (fun kind -> create_ignore ~line ~kind)
          >>| (fun data -> Int.Map.add_multi ~key:line_index ~data ignore_lines)
          |> Option.value ~default:ignore_lines
        in
        if String.is_prefix ~prefix:"#" (String.strip line) && Option.is_none current_line_mode then
          (* Increment ignores applied to current line if it is a comment. *)
          match Int.Map.find ignore_lines line_index with
          | Some ignores -> (
              let ignore_lines = Int.Map.remove ignore_lines line_index in
              match Int.Map.find ignore_lines (line_index + 1) with
              | Some existing_ignores ->
                  Int.Map.set
                    ~key:(line_index + 1)
                    ~data:(List.map ~f:Ignore.increment ignores @ existing_ignores)
                    ignore_lines
              | None ->
                  Int.Map.set
                    ~key:(line_index + 1)
                    ~data:(List.map ~f:Ignore.increment ignores)
                    ignore_lines )
          | None -> ignore_lines
        else
          ignore_lines
      in
      let is_autogenerated =
        String.is_substring ~substring:("@" ^ "generated") line
        || String.is_substring ~substring:("@" ^ "auto-generated") line
      in
      let local_mode, unused_local_modes =
        match local_mode, current_line_mode with
        | Some _, Some mode -> local_mode, mode :: unused_local_modes
        | Some _, None -> local_mode, unused_local_modes
        | None, mode -> mode, unused_local_modes
      in
      let ignore_codes =
        if is_default_with_suppress line then
          let suppressed_codes =
            Str.global_substitute (Str.regexp "[^,0-9]+") (fun _ -> "") line
            |> String.split_on_chars ~on:[',']
            |> List.map ~f:int_of_string
          in
          suppressed_codes @ ignore_codes
        else
          ignore_codes
      in
      let version =
        match version with
        | Some _ -> version
        | None -> if is_python_2_shebang line then Some 2 else None
      in
      ( version,
        local_mode,
        unused_local_modes,
        ignore_codes,
        ignores,
        autogenerated || is_autogenerated )
    in
    let version, local_mode, unused_local_modes, ignore_codes, ignore_lines, autogenerated =
      List.map ~f:(fun line -> String.rstrip line |> String.lowercase) lines
      |> List.foldi ~init:(None, None, [], [], Int.Map.empty, false) ~f:collect
    in
    {
      autogenerated;
      local_mode;
      unused_local_modes = List.rev unused_local_modes;
      ignore_codes;
      ignore_lines = ignore_lines |> Int.Map.data |> List.concat;
      version = Option.value ~default:3 version;
      number_of_lines = List.length lines;
      raw_hash = [%hash: string list] lines;
    }
end

type t = {
  docstring: string option; [@hash.ignore]
  metadata: Metadata.t;
  source_path: SourcePath.t;
  statements: Statement.t list;
}
[@@deriving compare, eq, hash, sexp]

let pp format { statements; _ } =
  let print_statement statement = Format.fprintf format "%a\n" Statement.pp statement in
  List.iter statements ~f:print_statement


let location_sensitive_hash_fold state { metadata; source_path; statements; docstring } =
  ignore docstring;
  let state = Metadata.hash_fold_t state metadata in
  let state = SourcePath.hash_fold_t state source_path in
  List.fold statements ~init:state ~f:Statement.location_sensitive_hash_fold


let location_sensitive_compare left right =
  match Metadata.compare left.metadata right.metadata with
  | x when x <> 0 -> x
  | _ -> (
      match SourcePath.compare left.source_path right.source_path with
      | x when x <> 0 -> x
      | _ -> List.compare Statement.location_sensitive_compare left.statements right.statements )


let show source = Format.asprintf "%a" pp source

let mode ~configuration ~local_mode : mode =
  match local_mode, configuration with
  | _, { Configuration.Analysis.debug = true; _ } -> Debug
  | _, { Configuration.Analysis.infer = true; _ } -> Infer
  | Some { Node.value = Debug; _ }, _ -> Debug
  | Some { Node.value = Strict; _ }, _ -> Strict
  | Some { Node.value = Unsafe; _ }, _ -> Unsafe
  | Some { Node.value = Declare; _ }, _
  | Some { Node.value = PlaceholderStub; _ }, _ ->
      Declare
  | None, { Configuration.Analysis.strict = true; _ } -> Strict
  | None, _ -> Unsafe


let create_from_source_path ~docstring ~metadata ~source_path statements =
  { docstring; metadata; source_path; statements }


let create
    ?(docstring = None)
    ?(metadata = Metadata.create_for_testing ())
    ?(relative = "")
    ?(is_external = false)
    ?(priority = 0)
    statements
  =
  let source_path = SourcePath.create_for_testing ~relative ~is_external ~priority in
  { docstring; metadata; source_path; statements }


let ignore_lines { metadata = { Metadata.ignore_lines; _ }; _ } = ignore_lines

let statements { statements; _ } = statements

let top_level_define
    { source_path = { SourcePath.qualifier; _ }; statements; metadata = { Metadata.version; _ }; _ }
  =
  let statements =
    if version < 3 then
      []
    else
      statements
  in
  Statement.Define.create_toplevel ~qualifier:(Some qualifier) ~statements


let top_level_define_node ({ source_path = { SourcePath.qualifier; _ }; _ } as source) =
  let location =
    {
      Location.path = qualifier;
      start = { Location.line = 1; column = 1 };
      stop = { Location.line = 1; column = 1 };
    }
  in
  Node.create ~location (top_level_define source)


let wildcard_exports_of { source_path = { SourcePath.qualifier; _ }; statements; _ } =
  let open Statement in
  let open Expression in
  let toplevel_public, dunder_all =
    let gather_toplevel (public_values, dunder_all) { Node.value; _ } =
      let filter_private =
        let is_public name =
          let dequalified =
            Reference.drop_prefix ~prefix:qualifier name |> Reference.sanitize_qualified
          in
          if not (String.is_prefix ~prefix:"_" (Reference.show dequalified)) then
            Some dequalified
          else
            None
        in
        List.filter_map ~f:is_public
      in
      match value with
      | Statement.Assign
          {
            Assign.target = { Node.value = Name (Name.Identifier target); _ };
            value = { Node.value = Expression.(List names | Tuple names); _ };
            _;
          }
        when String.equal (Identifier.sanitized target) "__all__" ->
          let to_reference = function
            | { Node.value = Expression.String { value = name; _ }; _ } ->
                Reference.create name
                |> Reference.last
                |> (fun last -> if String.is_empty last then None else Some last)
                >>| Reference.create
            | _ -> None
          in
          public_values, Some (List.filter_map ~f:to_reference names)
      | Assign { Assign.target = { Node.value = Name target; _ }; _ } when is_simple_name target ->
          public_values @ filter_private [target |> name_to_reference_exn], dunder_all
      | Class { Class.name; _ } -> public_values @ filter_private [name], dunder_all
      | Define { Define.signature = { name; _ }; _ } ->
          public_values @ filter_private [name], dunder_all
      | Import { Import.imports; _ } ->
          let get_import_name { Import.alias; name } = Option.value alias ~default:name in
          public_values @ filter_private (List.map imports ~f:get_import_name), dunder_all
      | _ -> public_values, dunder_all
    in
    List.fold ~f:gather_toplevel ~init:([], None) statements
  in
  Option.value dunder_all ~default:toplevel_public |> List.dedup_and_sort ~compare:Reference.compare


let expand_relative_import ~from { source_path = { SourcePath.is_init; qualifier; _ }; _ } =
  match Reference.show from with
  | "builtins" -> Reference.empty
  | serialized ->
      (* Expand relative imports according to PEP 328 *)
      let dots = String.take_while ~f:(fun dot -> Char.equal dot '.') serialized in
      let postfix =
        match String.drop_prefix serialized (String.length dots) with
        (* Special case for single `.`, `..`, etc. in from clause. *)
        | "" -> Reference.empty
        | nonempty -> Reference.create nonempty
      in
      let prefix =
        if not (String.is_empty dots) then
          let initializer_module_offset =
            (* `.` corresponds to the directory containing the module. For non-init modules, the
               qualifier matches the path, so we drop exactly the number of dots. However, for
               __init__ modules, the directory containing it represented by the qualifier. *)
            if is_init then
              1
            else
              0
          in
          List.rev (Reference.as_list qualifier)
          |> (fun reversed -> List.drop reversed (String.length dots - initializer_module_offset))
          |> List.rev
          |> Reference.create_from_list
        else
          Reference.empty
      in
      Reference.combine prefix postfix
