from typing import Dict, Any

class TryOnServiceUnavailableError(Exception):
    def __init__(self, message: str = "Try-on service is currently unavailable. Please try again later."):
        self.message = message
        super().__init__(self.message)
        
    def to_http_response(self) -> Dict[str, Any]:
        return {
            "status_code": 503,
            "detail": self.message
        }

class InvalidImageError(Exception):
    def __init__(self, message: str = "The provided image is invalid or unreadable."):
        self.message = message
        super().__init__(self.message)
        
    def to_http_response(self) -> Dict[str, Any]:
        return {
            "status_code": 400,
            "detail": self.message
        }

class ImageTooLargeError(Exception):
    def __init__(self, message: str = "The provided image exceeds the maximum allowed size."):
        self.message = message
        super().__init__(self.message)
        
    def to_http_response(self) -> Dict[str, Any]:
        return {
            "status_code": 413,
            "detail": self.message
        }
