module HasParent
  extend ActiveSupport::Concern

  included do
    belongs_to :parent, class_name: self.name, inverse_of: :children
    has_many :children, class_name: self.name, foreign_key: :parent_id, inverse_of: :parent, dependent: :destroy

    scope :root, -> { where(parent_id: nil) }
    scope :with_parents, -> (*args) { where(parent_id: args.flatten) }

    scope :with_children, -> (*args)  {
      joins(
        <<-SQL
          LEFT OUTER JOIN #{self.table_name} children
          ON children.parent_id = #{self.table_name}.id
        SQL
      )
      .where(children: { id: args.flatten })
    }

    scope :aggregate_total_children, -> {
      select(
        <<-SQL
          COALESCE(total_children, 0) AS total_children
        SQL
      )
      .joins(
        <<-SQL
          LEFT OUTER JOIN
          (
            SELECT parent_id, COUNT(id) as total_children
            FROM #{self.table_name}
            GROUP BY parent_id
          ) AS children ON children.parent_id = #{self.table_name}.id
        SQL
      )
    }

    scope :aggregate_has_children, -> {
      select(
        <<-SQL
          CASE WHEN total_children > 0 THEN TRUE ELSE FALSE END as has_children
        SQL
      ).aggregate_total_children
    }
  end

  module ClassMethods
    def redefine_parent_child_relations
      belongs_to :parent, class_name: self.name, inverse_of: :children
      has_many :children, class_name: self.name, foreign_key: :parent_id, inverse_of: :parent, dependent: :destroy
    end

    def descendents(parent_id, relation = nil)
      queries = where(parent_id: parent_id).pluck(:id).flat_map do |child_id|
        "id in (#{descendents(child_id, relation).select(:id).to_sql})"
      end

      queries << "parent_id = #{parent_id}"
      queries << "id in (#{relation.select(:id).to_sql})" if relation

      where(queries.join(' OR '))
    end
  end
end
