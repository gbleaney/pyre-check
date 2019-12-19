# pyre-unsafe

from typing import List

from wsgi import IGWSGIRequest

DEBUG: int = ...
INFO: int = ...
SUCCESS: int = ...
WARNING: int = ...
ERROR: int = ...

def add_message(request: IGWSGIRequest, int, str) -> None: ...
def get_messages(request: IGWSGIRequest) -> List[str]: ...
