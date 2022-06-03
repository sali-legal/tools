create_table "sali_fields", force: :cascade do |t|
  t.string   "iri"
  t.string   "label"
  t.text     "definition", default: [],              array: true
  t.integer  "parent_id"
  t.datetime "created_at",              null: false
  t.datetime "updated_at",              null: false
end
