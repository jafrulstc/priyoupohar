#!/bin/bash

python -m compileall .
uv run ruff check .
uv run mypy .