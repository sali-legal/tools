class SaliFieldSerializer < ActiveModel::Serializer
  attributes :id, :text, :icon, :parent_id, :children, :definition

  def children
    if object.respond_to?(:has_children)
      object.has_children
    else
      object.children.any?
    end
  end

  def icon
    children ? 'icon-folder' : 'icon-file'
  end

  class MiniSerializer < ActiveModel::Serializer
    attributes :id, :text, :definition, :iri
  end
end
