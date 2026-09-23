# Ale Trail — Supabase schema (public)

33 tables

## admin_access
```
brewery_id: string | null
created_at: string
role: string
user_id: string
```

## admin_users_legacy
```
brewery_id: string | null
created_at: string | null
email: string
id: string
name: string
password_hash: string
role: string
trail_ids: string[] | null
updated_at: string | null
```

## analytics_events
```
created_at: string
event_name: string
id: string
props: Json
session_id: string | null
trail_id: string | null
user_id: string | null
```

## beer_ratings
```
beer_name: string
brewery_beer_id: string | null
brewery_id: string
created_at: string
id: string
notes: string | null
participant_id: string | null
rating: number
tags: string[] | null
trail_id: string
untappd_checkin_id: number | null
untappd_post_attempted: boolean
untappd_post_attempted_at: string | null
untappd_post_failed_reason: string | null
user_id: string | null
```

## breweries
```
address: string | null
checkin_enabled: boolean
created_at: string
description: Json
display_order: number
district: string | null
facebook_url: string | null
id: string
instagram_url: string | null
latitude: number | null
logo_url: string | null
longitude: number | null
manual_code: string | null
maps_url: string | null
name: string
operating_hours: Json | null
pin_code: string | null
qr_secret: string | null
status: Database["public"]["Enums"]["brewery_status"]
trail_id: string
updated_at: string
website_url: string | null
```

## brewery_beers
```
abv: number | null
active: boolean | null
brewery_id: string
created_at: string | null
id: string
name: string
style: string | null
untappd_beer_id: number | null
updated_at: string | null
```

## brewery_staff
```
accepted_at: string | null
brewery_id: string
email: string
id: string
invited_at: string | null
invited_by: string | null
role: string
status: string
user_id: string | null
```

## card_breweries
```
brewery_id: string
card_id: string
created_at: string
id: string
weight: number
```

## card_dependencies
```
created_at: string
id: string
requires_card_id: string
rule: Json
trail_id: string
unlocks_card_id: string
```

## cards
```
created_at: string
description: Json
end_at: string | null
id: string
is_public: boolean
slug: string
stamp_target: number
start_at: string | null
status: Database["public"]["Enums"]["challenge_status"]
subtitle: Json
title: Json
trail_id: string
type: Database["public"]["Enums"]["card_type"]
updated_at: string
```

## checkins
```
brewery_id: string
card_id: string | null
card_round: number
checked_in_at: string
id: string
meta: Json
method: Database["public"]["Enums"]["checkin_method"]
participant_id: string | null
trail_id: string
user_id: string | null
```

## data_licenses
```
created_at: string
end_at: string | null
id: string
licensee_name: string
notes: string | null
price_usd: number | null
scope: Json
start_at: string | null
status: Database["public"]["Enums"]["data_license_status"]
trail_id: string
updated_at: string
```

## events
```
brewery_id: string | null
category: string
created_at: string
description: Json | null
ends_at: string | null
id: string
link: string | null
starts_at: string
status: string
title: Json
trail_id: string
updated_at: string
```

## feature_flags
```
created_at: string
description: string | null
enabled: boolean
id: string
key: string
rules: Json
trail_id: string
updated_at: string
```

## hat_claims
```
card_round: number
claimed_at: string
id: string
trail_id: string
user_id: string
```

## inventory_balances
```
id: string
location_id: string
merch_item_id: string
quantity: number
trail_id: string
updated_at: string
```

## inventory_events
```
actor_user_id: string | null
created_at: string
delta: number
event_type: Database["public"]["Enums"]["inventory_event_type"]
id: string
location_id: string
merch_item_id: string
note: string | null
trail_id: string
```

## inventory_locations
```
brewery_id: string | null
created_at: string
id: string
name: string
trail_id: string
```

## merch_items
```
active: boolean
created_at: string
description: Json
id: string
image_url: string | null
name: string
reward_type: Database["public"]["Enums"]["reward_type"]
sku: string
trail_id: string
updated_at: string
```

## merchandise
```
active: boolean
created_at: string
description: string | null
id: string
low_stock_threshold: number
name: string
trail_id: string
updated_at: string
```

## merchandise_pickups
```
brewery_id: string
id: string
merchandise_id: string
participant_id: string
picked_up_at: string
recorded_by: string | null
```

## merchandise_restocks
```
brewery_id: string
created_at: string
id: string
merchandise_id: string
notes: string | null
quantity: number
restocked_by: string | null
```

## merchandise_stock
```
brewery_id: string
id: string
merchandise_id: string
quantity: number
updated_at: string
```

## nudges
```
created_at: string
id: string
milestone: number
seen_at: string | null
stamp_count: number
total_breweries: number
trail_id: string
user_id: string
```

## participants
```
archived_at: string | null
avatar: string | null
beer_styles: Json | null
birth_year: number | null
card_round: number
completed_at: string | null
country: string | null
created_at: string
display_name: string | null
email: string | null
era: string | null
gender: string | null
group_size: string | null
hat_claimed: boolean
hat_claimed_at: string | null
home_city: string | null
home_country: string | null
id: string
neighborhood: string | null
onboarding_completed_at: string | null
started_at: string | null
trail_id: string | null
updated_at: string
user_id: string | null
vibe: string | null
```

## redemptions
```
card_id: string | null
created_at: string
id: string
location_id: string | null
merch_item_id: string
meta: Json
status: string
trail_id: string
user_id: string
```

## side_quest_checkins
```
checked_in_at: string | null
id: string
method: string | null
participant_id: string | null
side_quest_id: string | null
```

## side_quest_ratings
```
created_at: string | null
id: string
item_name: string | null
notes: string | null
quest_id: string
rating: number
user_id: string | null
```

## side_quests
```
address: string | null
created_at: string
description: Json | null
district: string | null
facebook_url: string | null
id: string
instagram_url: string | null
latitude: number | null
longitude: number | null
maps_url: string | null
pin_code: string | null
reward: string | null
status: string
title: Json
trail_id: string
updated_at: string
```

## super_admins
```
added_by: string | null
created_at: string | null
email: string
id: string
user_id: string | null
```

## trails
```
brand_owner: string | null
city: string | null
country: string | null
created_at: string
description: Json
facebook_url: string | null
id: string
instagram_url: string | null
name: string
slug: string
stamp_target: number
status: Database["public"]["Enums"]["trail_status"]
updated_at: string
website_url: string | null
year: number | null
```

## user_roles
```
brewery_id: string | null
created_at: string
id: string
role: Database["public"]["Enums"]["admin_role"]
trail_id: string | null
user_id: string
```

## users
```
created_at: string | null
email: string | null
id: string
is_untappd_tester: boolean
legal_age_confirmed_at: string | null
untappd_access_token_encrypted: string | null
untappd_connected_at: string | null
untappd_disconnected_at: string | null
untappd_user_id: number | null
untappd_username: string | null
updated_at: string | null
```

