## Table `profiles`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `role` | `user_role` |  |
| `full_name` | `varchar` |  |
| `phone` | `varchar` |  Nullable |
| `photo_url` | `text` |  Nullable |
| `is_active` | `bool` |  Nullable |
| `last_login` | `timestamptz` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |
| `deleted_at` | `timestamptz` |  Nullable |
| `login_identifier` | `varchar` |  Nullable |
| `login_identifier_type` | `varchar` |  Nullable |

## Table `education_units`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary Identity |
| `code` | `varchar` |  Unique |
| `name` | `varchar` |  |
| `short_name` | `varchar` |  Nullable |
| `sort_order` | `int4` |  |
| `color_hex` | `varchar` |  Nullable |
| `is_active` | `bool` |  |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `periods`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary Identity |
| `academic_year` | `varchar` |  |
| `semester` | `varchar` |  |
| `display_name` | `varchar` |  Nullable |
| `start_date` | `date` |  |
| `end_date` | `date` |  |
| `registration_start` | `date` |  Nullable |
| `registration_end` | `date` |  Nullable |
| `is_active` | `bool` |  |
| `is_locked` | `bool` |  |
| `locked_at` | `timestamptz` |  Nullable |
| `locked_by` | `uuid` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |
| `deleted_at` | `timestamptz` |  Nullable |

## Table `enrollment_waves`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary Identity |
| `period_id` | `int4` |  |
| `name` | `varchar` |  |
| `quota` | `int4` |  Nullable |
| `start_date` | `date` |  Nullable |
| `end_date` | `date` |  Nullable |
| `is_active` | `bool` |  |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `classes`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary Identity |
| `education_unit_id` | `int4` |  |
| `academic_year` | `varchar` |  |
| `name` | `varchar` |  |
| `grade_level` | `int4` |  Nullable |
| `homeroom_teacher_id` | `int4` |  Nullable |
| `capacity` | `int4` |  Nullable |
| `is_active` | `bool` |  |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |
| `deleted_at` | `timestamptz` |  Nullable |

## Table `students`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary Identity |
| `registration_number` | `varchar` |  Unique |
| `billing_pin_hash` | `varchar` |  |
| `full_name` | `varchar` |  |
| `class_id` | `int4` |  Nullable |
| `education_unit_id` | `int4` |  Nullable |
| `enrollment_wave_id` | `int4` |  Nullable |
| `enrollment_type` | `varchar` |  Nullable |
| `gender` | `varchar` |  Nullable |
| `phone` | `varchar` |  Nullable |
| `guardian_name` | `varchar` |  Nullable |
| `guardian_phone` | `varchar` |  Nullable |
| `photo_url` | `text` |  Nullable |
| `card_number` | `varchar` |  Nullable Unique |
| `status` | `varchar` |  |
| `failed_pin_attempts` | `int4` |  |
| `locked_until` | `timestamptz` |  Nullable |
| `pin_set_at` | `timestamptz` |  Nullable |
| `last_login_at` | `timestamptz` |  Nullable |
| `enrolled_at` | `date` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |
| `deleted_at` | `timestamptz` |  Nullable |
| `tags` | `_text` |  Nullable |
| `metadata` | `jsonb` |  Nullable |

## Table `student_sessions`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `student_id` | `int4` |  |
| `token` | `varchar` |  Unique |
| `ip_address` | `inet` |  Nullable |
| `user_agent` | `text` |  Nullable |
| `expires_at` | `timestamptz` |  |
| `created_at` | `timestamptz` |  Nullable |
| `revoked_at` | `timestamptz` |  Nullable |

## Table `portal_access_logs`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `student_id` | `int4` |  Nullable |
| `registration_number_attempted` | `varchar` |  Nullable |
| `ip_address` | `inet` |  Nullable |
| `user_agent` | `text` |  Nullable |
| `success` | `bool` |  |
| `fail_reason` | `varchar` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `categories`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary Identity |
| `name` | `varchar` |  |
| `description` | `varchar` |  Nullable |
| `is_active` | `bool` |  |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `suppliers`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary Identity |
| `name` | `varchar` |  |
| `contact_person` | `varchar` |  Nullable |
| `phone` | `varchar` |  Nullable |
| `email` | `varchar` |  Nullable |
| `address` | `text` |  Nullable |
| `is_active` | `bool` |  |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `products`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary Identity |
| `sku` | `varchar` |  Nullable Unique |
| `barcode` | `varchar` |  Nullable Unique |
| `name` | `varchar` |  |
| `category_id` | `int4` |  Nullable |
| `supplier_id` | `int4` |  Nullable |
| `unit` | `varchar` |  |
| `cost_price` | `numeric` |  |
| `selling_price` | `numeric` |  |
| `image_url` | `text` |  Nullable |
| `description` | `text` |  Nullable |
| `is_active` | `bool` |  |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |
| `deleted_at` | `timestamptz` |  Nullable |

## Table `product_stocks`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `product_id` | `int4` | Primary |
| `quantity` | `int4` |  |
| `min_stock` | `int4` |  |
| `updated_at` | `timestamptz` |  Nullable |

## Table `stock_movements`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `product_id` | `int4` |  |
| `movement_type` | `varchar` |  |
| `quantity` | `int4` |  |
| `reference_type` | `varchar` |  Nullable |
| `reference_id` | `int4` |  Nullable |
| `note` | `text` |  Nullable |
| `created_by` | `uuid` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `subjects`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary Identity |
| `code` | `varchar` |  Nullable Unique |
| `name` | `varchar` |  |
| `is_active` | `bool` |  |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `books`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary Identity |
| `product_id` | `int4` |  Unique |
| `isbn` | `varchar` |  Nullable Unique |
| `subject_id` | `int4` |  Nullable |
| `education_unit_id` | `int4` |  Nullable |
| `grade_level` | `int4` |  Nullable |
| `is_active` | `bool` |  |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `book_bundles`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary Identity |
| `name` | `varchar` |  |
| `class_id` | `int4` |  Nullable |
| `total_price` | `numeric` |  Nullable |
| `is_active` | `bool` |  |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |
| `deleted_at` | `timestamptz` |  Nullable |

## Table `book_bundle_items`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary Identity |
| `bundle_id` | `int4` |  |
| `book_id` | `int4` |  |
| `quantity` | `int4` |  |
| `created_at` | `timestamptz` |  Nullable |

## Table `teachers`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary Identity |
| `full_name` | `varchar` |  |
| `nip` | `varchar` |  Nullable |
| `phone` | `varchar` |  Nullable |
| `email` | `varchar` |  Nullable |
| `is_active` | `bool` |  |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |
| `deleted_at` | `timestamptz` |  Nullable |

## Table `feature_flags`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary |
| `key` | `text` |  Unique |
| `enabled` | `bool` |  |
| `label` | `text` |  Nullable |
| `description` | `text` |  Nullable |
| `category` | `text` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `news`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary |
| `title` | `text` |  |
| `slug` | `text` |  Unique |
| `excerpt` | `text` |  Nullable |
| `content` | `text` |  Nullable |
| `tag` | `text` |  Nullable |
| `image_url` | `text` |  Nullable |
| `image_alt` | `text` |  Nullable |
| `is_published` | `bool` |  |
| `is_featured` | `bool` |  |
| `scheduled_at` | `timestamptz` |  Nullable |
| `meta_title` | `text` |  Nullable |
| `meta_description` | `text` |  Nullable |
| `read_time` | `int4` |  Nullable |
| `focus_keyword` | `text` |  Nullable |
| `seo_score` | `int4` |  Nullable |
| `display_name` | `text` |  Nullable |
| `author` | `text` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `news_revisions`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary |
| `news_id` | `int8` |  |
| `content` | `text` |  Nullable |
| `title` | `text` |  Nullable |
| `author_id` | `uuid` |  Nullable |
| `author_name` | `text` |  Nullable |
| `created_at` | `timestamptz` |  |

## Table `error_logs`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `error_id` | `text` |  |
| `error_type` | `text` |  Nullable |
| `message` | `text` |  Nullable |
| `stack` | `text` |  Nullable |
| `component_stack` | `text` |  Nullable |
| `route` | `text` |  Nullable |
| `user_agent` | `text` |  Nullable |
| `user_id` | `uuid` |  Nullable |
| `retry_count` | `int4` |  Nullable |
| `is_offline` | `bool` |  Nullable |
| `resolved` | `bool` |  Nullable |
| `created_at` | `timestamptz` |  |

