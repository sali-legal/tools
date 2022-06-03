class SaliField < ActiveRecord::Base
  include HasParent

  has_many :firm_created_fields, inverse_of: :sali_field, dependent: :nullify

  alias_attribute :text, :label

  def self.searchable_columns
    [:label]
  end

  def self.search_path(search_str, fields = [], result = [])
    return result if search_str.blank? && fields.blank?
    if search_str
      result << search(search_str).map(&:id)
    else
      result << fields.pluck(:id)
    end

    search_path(nil, with_children(result.last), result.flatten)
  end
end
