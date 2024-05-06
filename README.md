# Terraform HTTP backend on Cloudflare Workers

This is an implementation of [Terraform HTTP backend](https://developer.hashicorp.com/terraform/language/settings/backends/http) on Cloudflare Workers.

## Configuration and Deployment

Before anything else, install packages:

```console
% npm install
```

Create a KV namespace and R2 bucket for the worker, and configure `wrangler.toml` accordingly:

```console
% cp wrangler.example.toml wrangler.toml
% edit wrangler.toml
```

Set the username and password for HTTP basic authentication:

```console
% wrangler secret put TF_HTTP_USERNAME --env production
% wrangler secret put TF_HTTP_PASSWORD --env production

# optional: e.g. "terraform/"
% wrangler secret put BUCKET_PATH_PREFIX --env production
```

Build and deploy the worker:

```console
% npm install

% npm run deploy
```

That's it.  You'll have a worker running at `https://tf-backend-worker.your-name.workers.dev/`.

## Terraform configuration

```hcl
terraform {
  backend "http" {
  }
}
```

Then feed the terraform command with your backend settings via environment variables like this:

```console
% TF_HTTP_ADDRESS=https://tf-backend-worker.your-name.workers.dev/terraform.tfstate \
  TF_HTTP_LOCK_ADDRESS=https://tf-backend-worker.your-name.workers.dev/terraform.tfstate \
  TF_HTTP_UNLOCK_ADDRESS=https://tf-backend-worker.your-name.workers.dev/terraform.tfstate \
  TF_HTTP_USERNAME=username TF_HTTP_PASSWORD=password \
  terraform init
```

### Terragrunt

Here's an example of how to generate a backend configuration file per directory with Terragrunt:

```hcl
generate "backend" {
  path = "_backend.tf"
  if_exists = "overwrite_terragrunt"
  contents = <<EOF
terraform {
  backend "http" {
    address        = "${get_env("TF_HTTP_ADDRESS_BASE")}${get_path_from_repo_root()}.tfstate"
    lock_address   = "${get_env("TF_HTTP_ADDRESS_BASE")}${get_path_from_repo_root()}.tfstate"
    unlock_address = "${get_env("TF_HTTP_ADDRESS_BASE")}${get_path_from_repo_root()}.tfstate"
  }
}
EOF
}
```

Then feed the terragrunt command with your backend settings via environment variables like this:

```console
% TF_HTTP_ADDRESS_BASE=https://tf-backend-worker.your-name.workers.dev/ \
  TF_HTTP_USERNAME=username TF_HTTP_PASSWORD=password \
  terragrunt init
```

## Author

Copyright (c) 2024 Akinori Musha.

Licensed under the 2-clause BSD license.  See `LICENSE` for details.

Visit the [GitHub Repository](https://github.com/knu/tf-backend-worker) for the latest information.
