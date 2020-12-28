(window.webpackJsonp=window.webpackJsonp||[]).push([[7],{75:function(e,t,n){"use strict";n.r(t),n.d(t,"frontMatter",(function(){return i})),n.d(t,"metadata",(function(){return c})),n.d(t,"rightToc",(function(){return s})),n.d(t,"default",(function(){return p}));var a=n(3),r=n(7),o=(n(0),n(91)),i={id:"types-in-python",title:"Types in Python",sidebar_label:"Types in Python"},c={unversionedId:"types-in-python",id:"types-in-python",isDocsHomePage:!1,title:"Types in Python",description:"Python's type system was specified in PEP 484. If you are new to Python's type system and want to learn the basics, we highly recommend you take a look at mypy's cheatsheet as well as their type system reference. The following discussion focuses on Pyre's approach to \"gradual typing\" and how you can get from an untyped codebase to a fully typed codebase.",source:"@site/docs/gradual_typing.md",slug:"/types-in-python",permalink:"/docs/types-in-python",editUrl:"https://github.com/facebook/pyre-check/tree/master/documentation/website/docs/gradual_typing.md",version:"current",sidebar_label:"Types in Python",sidebar:"pyre",previous:{title:"Configuration",permalink:"/docs/configuration"},next:{title:"Errors",permalink:"/docs/errors"}},s=[{value:"Gradual Typing",id:"gradual-typing",children:[]},{value:"Strict Mode",id:"strict-mode",children:[{value:"Strict-By-Default",id:"strict-by-default",children:[]}]},{value:"When Source Code is not Available",id:"when-source-code-is-not-available",children:[]},{value:"Strategies for Increasing Coverage",id:"strategies-for-increasing-coverage",children:[{value:"Upgrade",id:"upgrade",children:[]},{value:"Automatic Type Inference",id:"automatic-type-inference",children:[]}]}],l={rightToc:s};function p(e){var t=e.components,n=Object(r.a)(e,["components"]);return Object(o.b)("wrapper",Object(a.a)({},l,n,{components:t,mdxType:"MDXLayout"}),Object(o.b)("p",null,"Python's type system was specified in ",Object(o.b)("a",Object(a.a)({parentName:"p"},{href:"https://www.python.org/dev/peps/pep-0484/"}),"PEP 484"),". If you are new to Python's type system and want to learn the basics, we highly recommend you take a look at ",Object(o.b)("a",Object(a.a)({parentName:"p"},{href:"https://mypy.readthedocs.io/en/stable/cheat_sheet_py3.html"}),"mypy's cheatsheet")," as well as their ",Object(o.b)("a",Object(a.a)({parentName:"p"},{href:"https://mypy.readthedocs.io/en/stable/builtin_types.html"}),"type system reference"),'. The following discussion focuses on Pyre\'s approach to "gradual typing" and how you can get from an untyped codebase to a fully typed codebase.'),Object(o.b)("h2",{id:"gradual-typing"},"Gradual Typing"),Object(o.b)("p",null,"Most Python code does not (yet) start out typed. PEP 484 specifies a ",Object(o.b)("a",Object(a.a)({parentName:"p"},{href:"https://en.wikipedia.org/wiki/Gradual_typing"}),"gradual type system"),", which is built to allow you to ",Object(o.b)("em",{parentName:"p"},"gradually")," add annotations over time. It does so by"),Object(o.b)("ul",null,Object(o.b)("li",{parentName:"ul"},"only reporting errors on functions that have an explicit return type annotation,"),Object(o.b)("li",{parentName:"ul"},"introducing an escape hatch: a special type ",Object(o.b)("inlineCode",{parentName:"li"},"Any")," that has all possible attributes and is both sub- and super-type of any other type,"),Object(o.b)("li",{parentName:"ul"},"and assuming that all untyped fuctions implicitly return ",Object(o.b)("inlineCode",{parentName:"li"},"Any"),".")),Object(o.b)("p",null,"For example,"),Object(o.b)("pre",null,Object(o.b)("code",Object(a.a)({parentName:"pre"},{className:"language-python"}),'from typing import List\n\ndef unannotated():        # implictly returns `Any`\n    return b"" + ""       # function body is not checked\n\ndef annotated() -> List:  # explicit return annotation means we type check `annotated`\n    any = unannotated()\n    any.attribute         # `Any` has all possible attributes\n    return 1              # Error: returning `int` but expecting `List`\n')),Object(o.b)("p",null,"In combination, these rules allow you to slowly annotate code without getting overwhelmed by type errors in one sitting. Incrementally adding more annotations will give you stronger safety and consistency guarantees in your codebase."),Object(o.b)("p",null,"In the example above, if you changed ",Object(o.b)("inlineCode",{parentName:"p"},"unannotated")," to return ",Object(o.b)("inlineCode",{parentName:"p"},"str"),", you would get a type error when accessing the attribute ",Object(o.b)("inlineCode",{parentName:"p"},"any.attribute")," in ",Object(o.b)("inlineCode",{parentName:"p"},"annotated"),"."),Object(o.b)("h2",{id:"strict-mode"},"Strict Mode"),Object(o.b)("p",null,"While ",Object(o.b)("inlineCode",{parentName:"p"},"Any")," is a necessary escape hatch when annotating large codebases over time, it can hide legitimate type errors. We've introduced ",Object(o.b)("em",{parentName:"p"},"strict mode")," in Pyre to address this problem. Strict mode can be toggled at a module level by introducing a ",Object(o.b)("inlineCode",{parentName:"p"},"# pyre-strict")," comment to the file. In strict mode, Pyre will"),Object(o.b)("ul",null,Object(o.b)("li",{parentName:"ul"},"run on all functions, whether they are annotated or not,"),Object(o.b)("li",{parentName:"ul"},"error on functions, globals, or attributes that are missing annotations,"),Object(o.b)("li",{parentName:"ul"},"and error on annotations containing ",Object(o.b)("inlineCode",{parentName:"li"},"Any")," (with some exceptions to accomodate for common patterns).")),Object(o.b)("p",null,"In our previous example,"),Object(o.b)("pre",null,Object(o.b)("code",Object(a.a)({parentName:"pre"},{className:"language-python"}),'# pyre-strict\nfrom typing import List\n\ndef unannotated():        # Error: missing return annotation\n    return b"" + ""       # Error: function body *is* checked\n\ndef annotated() -> List:  # Error: implicit `Any` for generic parameter to `List`\n    any = unannotated()\n    any.attribute         # Note: the type of `any` is still any.\n    return 1              # Error: returning `int` but expecting `List`\n')),Object(o.b)("p",null,"As you can see in the example, ",Object(o.b)("inlineCode",{parentName:"p"},"Any")," can still sneak into modules that are strict, but increasing strict coverage and fixing the surfaced errors will gradually eliminate them."),Object(o.b)("h3",{id:"strict-by-default"},"Strict-By-Default"),Object(o.b)("p",null,"Strict mode can also be set as the default in a ",Object(o.b)("a",Object(a.a)({parentName:"p"},{href:"/docs/configuration"}),"project configuration"),". To opt individual files out of strict mode, use ",Object(o.b)("inlineCode",{parentName:"p"},"# pyre-unsafe")," in place of ",Object(o.b)("inlineCode",{parentName:"p"},"# pyre-strict"),"."),Object(o.b)("h2",{id:"when-source-code-is-not-available"},"When Source Code is not Available"),Object(o.b)("p",null,"We do not always have access to all the source code that contributes type information to our project: e.g. ",Object(o.b)("inlineCode",{parentName:"p"},"builtins")," is compiled native code, and other libraries may be using ",Object(o.b)("em",{parentName:"p"},"cython"),". Other times, we may be working with Python code that is just too dynamic to be reasonably typed."),Object(o.b)("p",null,"To address these cases, Pyre will give precedence to type ",Object(o.b)("em",{parentName:"p"},"stub files")," with a ",Object(o.b)("inlineCode",{parentName:"p"},"*.pyi")," extension over source files when these are specified in the search path in the ",Object(o.b)("a",Object(a.a)({parentName:"p"},{href:"/docs/configuration"}),"project configuration")," or if they are located next to the implementation file.\nStub files have the same structure as implementation files but only contain class and function signatures:"),Object(o.b)("pre",null,Object(o.b)("code",Object(a.a)({parentName:"pre"},{className:"language-python"}),"# my_dynamic_module.pyi\ndef dynamic_function() -> int: ...   # Function body is omitted\n")),Object(o.b)("p",null,"If a ",Object(o.b)("inlineCode",{parentName:"p"},"__getattr__")," function is defined in the stub file as follows, Pyre will take it as a signal that the stub file is partially complete: accessing attributes whose name is not defined in the stub file will result in ",Object(o.b)("inlineCode",{parentName:"p"},"Any")," instead of a type error."),Object(o.b)("pre",null,Object(o.b)("code",Object(a.a)({parentName:"pre"},{className:"language-python"}),"# my_stub.pyi\nfrom typing import Any\nfoo: int = 42\n# Parameter needs to be typed as `str` and return type needs to be `Any`\ndef __getattr__(name: str) -> Any: ...\n\n# my_source.py\nimport my_stub\nreveal_type(my_stub.foo)        # Reveals `int`\nreveal_type(my_stub.undefined)  # Reveals `Any`\n")),Object(o.b)("h2",{id:"strategies-for-increasing-coverage"},"Strategies for Increasing Coverage"),Object(o.b)("p",null,"Pyre comes with tooling to make it easy to increase type coverage in your project."),Object(o.b)("h3",{id:"upgrade"},"Upgrade"),Object(o.b)("p",null,"When upgrading the type checker, new errors inevitably get surfaced. In order to keep a codebase clean through upgrades we've built ",Object(o.b)("inlineCode",{parentName:"p"},"pyre-upgrade"),", which automatically ",Object(o.b)("a",Object(a.a)({parentName:"p"},{href:"errors#suppression"}),"suppresses")," newly surfaced type errors. It takes Pyre's output and adds supression comments to the code explaining what's wrong so that developers can easily address the issues individually."),Object(o.b)("p",null,"You can run ",Object(o.b)("inlineCode",{parentName:"p"},"pyre-upgrade")," with"),Object(o.b)("pre",null,Object(o.b)("code",Object(a.a)({parentName:"pre"},{className:"language-bash"}),"(venv) $ pyre --output=json | pyre-upgrade fixme\n")),Object(o.b)("h3",{id:"automatic-type-inference"},"Automatic Type Inference"),Object(o.b)("p",null,"We have found tools that automatically add type annotations to code useful to get started with a project. There are two general approaches to automatic type inference: static inference and dynamic inference from runtime information. Both approaches come with their own trade-offs and we have found a combination of the two to be useful."),Object(o.b)("p",null,"Pyre can do static type inference. You can run"),Object(o.b)("pre",null,Object(o.b)("code",Object(a.a)({parentName:"pre"},{className:"language-bash"}),"(venv) $ pyre infer -i <directory or path>\n")),Object(o.b)("p",null,"to automatically apply annotations."),Object(o.b)("p",null,"For dynamic inference we recommend you give ",Object(o.b)("a",Object(a.a)({parentName:"p"},{href:"https://github.com/Instagram/MonkeyType"}),"MonkeyType")," a try."))}p.isMDXComponent=!0},91:function(e,t,n){"use strict";n.d(t,"a",(function(){return u})),n.d(t,"b",(function(){return y}));var a=n(0),r=n.n(a);function o(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function i(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function c(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?i(Object(n),!0).forEach((function(t){o(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):i(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function s(e,t){if(null==e)return{};var n,a,r=function(e,t){if(null==e)return{};var n,a,r={},o=Object.keys(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var l=r.a.createContext({}),p=function(e){var t=r.a.useContext(l),n=t;return e&&(n="function"==typeof e?e(t):c(c({},t),e)),n},u=function(e){var t=p(e.components);return r.a.createElement(l.Provider,{value:t},e.children)},b={inlineCode:"code",wrapper:function(e){var t=e.children;return r.a.createElement(r.a.Fragment,{},t)}},d=r.a.forwardRef((function(e,t){var n=e.components,a=e.mdxType,o=e.originalType,i=e.parentName,l=s(e,["components","mdxType","originalType","parentName"]),u=p(n),d=a,y=u["".concat(i,".").concat(d)]||u[d]||b[d]||o;return n?r.a.createElement(y,c(c({ref:t},l),{},{components:n})):r.a.createElement(y,c({ref:t},l))}));function y(e,t){var n=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var o=n.length,i=new Array(o);i[0]=d;var c={};for(var s in t)hasOwnProperty.call(t,s)&&(c[s]=t[s]);c.originalType=e,c.mdxType="string"==typeof e?e:a,i[1]=c;for(var l=2;l<o;l++)i[l]=n[l];return r.a.createElement.apply(null,i)}return r.a.createElement.apply(null,n)}d.displayName="MDXCreateElement"}}]);