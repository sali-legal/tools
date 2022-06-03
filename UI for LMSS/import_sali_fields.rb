require 'activerecord-import/base'
require 'activerecord-import/active_record/adapters/postgresql_adapter'

KEYS = ['rdf:about', 'label', 'definition', 'altLabel', 'hasRelatedSynonym', 'isDefinedBy', 'seeAlso', 'description']
ROOT_IRI= 'http://www.w3.org/2002/07/owl#Thing'
EXCLUDED_ROOTS = {
  'root' => ROOT_IRI,
  'LMSS Type' => 'http://lmss.sali.org/R8uI6AZ9vSgpAdKmfGZKfTZ',
  'ZZZ - UNDER CONSTRUCTION' => 'http://lmss.sali.org/R8zL0uhEOQuxBZcdYyS8ORn',
  'Data Format' => 'http://lmss.sali.org/R79aItNTJQwHgR002wuX3iC',
  'Location' => 'http://lmss.sali.org/R9aSzp9cEiBCzObnP92jYFX',
  'Currency' => 'http://lmss.sali.org/R767niCLQVC5zIcO5WDQMSl',
  'Standards Compatibility' => 'http://lmss.sali.org/RB4cFSLB4xvycDlKv73dOg6',
}

def remove_root!(nodes)
  parent = nodes.find { |node| node['rdf:about'] == ROOT_IRI }
  children = query_by_parent(nodes, parent)
  children.each do |node|
    subclass = node['subClassOf']
    case subclass.class.name
    when 'Hash'
      node.delete('subClassOf')
    when 'Array'
      resources = subclass.map { |item| item['rdf:resource'] }.compact
      if resources.size == 1
        subclass.delete('rdf:resource')
      elsif resources.size > 1
        node['subClassOf'] = subclass.reject { |item| item['rdf:resource'] == parent['rdf:about'] }
      end
    end
  end
end

def query_excluded(nodes)
  nodes.select { |node| EXCLUDED_ROOTS.values.include?(node['rdf:about']) }
end

def query_roots(nodes)
  nodes.select { |node| node['subClassOf'].blank? }
end

def query_by_parent(nodes, parent, options = {})
  nodes.select do |node|
    next unless subclass = node['subClassOf']
    case subclass.class.name
    when 'Hash'
      subclass['rdf:resource'] == parent['rdf:about']
    when 'Array'
      resources = subclass.map { |item| item['rdf:resource'] }.compact
      if options[:for_deletion]
        resources.size == 1 && resources.first == parent['rdf:about']
      else
        resources.include?(parent['rdf:about'])
      end
    end
  end
end

def soft_cleanup!(nodes)
  nodes.reject! { |node| node['deprecated'] == 'true' }
end

def deep_cleanup!(nodes, excluded)
  nodes.reject! { |node| excluded.include?(node) }
  excluded.each do |parent|
    children = query_by_parent(nodes, parent, for_deletion: true)
    deep_cleanup!(nodes, children)
  end
end

def cleanup!(nodes)
  remove_root!(nodes)
  soft_cleanup!(nodes)
  excluded = query_excluded(nodes)
  deep_cleanup!(nodes, excluded)
end

def cleanup_definition(definition)
  [definition].flatten.compact.map(&:squish).uniq
end

def build_leaf(node)
  {
    iri: node['rdf:about'],
    label: node['label'],
    definition: cleanup_definition(node['definition']),
    children: [],
  }
end

def build_tree(nodes, node, tree)
  leaf = build_leaf(node)
  tree << leaf

  children = query_by_parent(nodes, node)
  children.each do |child|
    build_tree(nodes, child, leaf[:children])
  end
end

def flatten_tree(tree)
  result = tree.to_a.flat_map do |leaf|
    [leaf, flatten_tree(leaf[:children])]
  end

  result.flatten
end

def create_records(nodes, parent = nil)
  fields = nodes.map do |node|
    {
      iri: node[:iri],
      label: node[:label],
      definition: node[:definition],
      parent_id: parent&.id,
    }
  end

  result = SaliField.import(fields)
  current = SaliField.where(id: result['ids']).index_by(&:iri)

  nodes.each do |node|
    create_records(node[:children], current[node[:iri]])
  end
end

def generate
  file = open('https://nextchapter-documents.s3.us-west-2.amazonaws.com/sali(20210930).owl')
  xml_feed = Nokogiri::XML(file).to_xml
  nodes = Hash.from_xml(xml_feed)['RDF']['Class']

  cleanup!(nodes)

  tree = []

  roots = query_roots(nodes)
  roots.each do |node|
    build_tree(nodes, node, tree)
  end

  ActiveRecord::Base.transaction do
    create_records(tree)
    raise ActiveRecord::Rollback unless SaliField.count == flatten_tree(tree).size
  end
end

generate

