module NCQuery
  class SaliField
    include NCQuery::Base

    queryable_model(::SaliField)

    def self.search(params, ability = nil)
      super do |result|
        result = result.root unless params[:parent_id]
        result
          .select('sali_fields.*')
          .aggregate_has_children
          .order(label: :asc)
      end
    end

    def self.massload(params, ability = nil)
      params[:parent_id] = params.delete(:ids).split(',')
      result = search(params, ability)
      result
        .map(&:serialize)
        .group_by { |x| x[:parent_id] }
    end
  end
end
