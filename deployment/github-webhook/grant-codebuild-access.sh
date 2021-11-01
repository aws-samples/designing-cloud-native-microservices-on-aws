#!/usr/bin/env bash
aws codebuild import-source-credentials --server-type GITHUB --auth-type PERSONAL_ACCESS_TOKEN --token $(github-personal-token)