import os
import uuid
import time
import shutil
from typing import Optional
from gradio_client import Client
from .exceptions import TryOnServiceUnavailableError

class TryOnPipeline:
    def __init__(self) -> None:
        self.hf_space_id = os.environ.get("HF_SPACE_ID", "yisol/IDM-VTON")
        self.results_dir = os.path.join("/tmp", "results")
        os.makedirs(self.results_dir, exist_ok=True)
        
    def run(self, person_image_path: str, garment_image_path: str) -> str:
        """
        Executes the try-on pipeline by connecting to the specified Hugging Face Space.
        Returns the absolute local path to the generated result image.
        """
        max_retries = 3
        retry_delay = 2
        
        for attempt in range(1, max_retries + 1):
            try:
                print(f"[Pipeline] Attempt {attempt}/{max_retries}...")
                
                # Initialize the Gradio Client. Using timeout via environment if supported,
                # though gradio_client implicitly handles reasonable connection waits.
                # In a robust setup, passing HF_TOKEN from environment is recommended if Space is private.
                hf_token = os.environ.get("HF_TOKEN")
                client_kwargs = {}
                if hf_token:
                    client_kwargs["hf_token"] = hf_token
                    
                client = Client(self.hf_space_id, **client_kwargs)
                
                # The exact API parameters for yisol/IDM-VTON are passed here
                result = client.predict(
                   dict={"background": person_image_path, "layers": [], "composite": None},
garm_img=garment_image_path,
                    garment_des="Premium apparel",
                    is_checked=True,
                    is_checked_crop=False,
                    denoise_steps=30,
                    seed=42,
                    api_name="/tryon"
                )
                
                result_path = self._save_result(result[0] if isinstance(result, tuple) else result)
                print(f"[Pipeline] Success. Result saved to {result_path}")
                return result_path
                
            except Exception as e:
                print(f"[Pipeline] Attempt {attempt} failed: {e}")
                if attempt == max_retries:
                    raise TryOnServiceUnavailableError(f"Hugging Face space '{self.hf_space_id}' unreachable after {max_retries} attempts.")
                time.sleep(retry_delay)
                
        raise TryOnServiceUnavailableError("Service unavailable.")

    def _save_result(self, result_file: str) -> str:
        """
        Copies the generated file from gradio's temp directory to our controlled /tmp/results/ directory.
        """
        result_id = str(uuid.uuid4())
        # Preserve original extension or default to .jpg
        ext = os.path.splitext(result_file)[1]
        if not ext:
            ext = ".jpg"
            
        final_path = os.path.join(self.results_dir, f"{result_id}{ext}")
        shutil.copyfile(result_file, final_path)
        
        return final_path
