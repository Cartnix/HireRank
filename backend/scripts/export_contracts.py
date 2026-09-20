"""Export FastAPI OpenAPI and component schemas to the shared contract folder."""

import json
from pathlib import Path

from app.main import app


ROOT = Path(__file__).resolve().parents[2]
OUTPUT_DIR = ROOT / "contracts" / "generated" / "backend"


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    openapi = app.openapi()
    (OUTPUT_DIR / "openapi.json").write_text(
        json.dumps(openapi, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    (OUTPUT_DIR / "schemas.json").write_text(
        json.dumps(openapi.get("components", {}).get("schemas", {}), indent=2, ensure_ascii=False)
        + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()