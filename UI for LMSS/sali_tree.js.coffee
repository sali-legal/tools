app = angular.module('nc-components')

app.directive('saliTooltip', ->
  restrict: 'E'
  replace: true
  scope:
    ngModel: '='
  template: """
              <span>
                <i class="help-icon" ng-if="ngModel.sali_definition" tooltip="{{ngModel.sali_definition.join('<br><br>')}}" html="true"></i>
                <i class="help-icon" ng-if="ngModel.definition" tooltip="{{ngModel.definition.join('<br><br>')}}" html="true"></i>
              </span>
            """
)

app.directive('saliTree', ['$debounce', ($debounce) ->
  restrict: 'E'
  replace: true
  scope:
    selected: '=?'
    stateKey: '@?'
    query: '=?'
    scrollable: '=?'
  template: """
              <div>
                <ng-container loading="loading"></ng-container>
                <div ng-class="{invisible: loading}">
                  <div class="form-group">
                    <search-field ng-model="query"></search-field>
                  </div>
                  <div class="row" ng-if="selected.definition.length" >
                    <div class="col-4 offset-8 position-relative">
                      <div class="position-absolute bg-light-light p-3 rounded scrollable" style="top: 0; right: 30px;">
                        <div ng-repeat="def in selected.definition" class="d-flex">
                          <div class="mr-2"><i class="material-icons">help</i></div>
                          <div ng-bind="def"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div ng-class="{scrollable: scrollable}" class="row" style="min-height: 50vh">
                    <div class="col-8">
                      <div id="root" ></div>
                    </div>
                  </div>
                </div>
              </div>
            """
  link: (scope, element) ->
    tree = null
    scope.loading = true
    treeElement = element.find('#root')

    searchTree = (str) ->
      return unless tree
      tree.jstree(true).search(str || '')

    closeAll = ->
      tree.jstree(true).close_all()

    loadNode = (obj) ->
      tree.jstree(true).load_node(obj)

    findNode = (obj) ->
      tree.jstree(true).get_node(obj)

    getSelectedNode = ->
      tree.jstree(true).get_selected([false])[0]

    deselectAll = ->
      tree.jstree(true).deselect_all()

    selectNode = (obj, scrollTo = false) ->
      deselectAll()
      tree.jstree(true).select_node(obj, true, false)
      element.find("##{obj.a_attr.id}")
        .get(0)
        .scrollIntoView(behavior: 'smooth') if scrollTo

    init = ->
      tree = treeElement.jstree(
        plugins: ['search', 'massload', 'state']
        state:
          key: "salitree_#{scope.query || scope.stateKey || scope.$id}"
        core:
          multiple: false
          data:
            url: 'sali_fields.json'
            data: (node) ->
              parent_id: node.id unless node.id == '#'
        search:
          case_sensitive: false
          show_only_matches: true
          close_opened_onclear: !scope.selected?
          ajax:
            url: '/sali_fields/search.json'
        massload:
          url: '/sali_fields/massload.json'
          data: (ids) ->
            ids: ids.join(',')
      )

    treeElement.on 'state_ready.jstree', ->
      closeAll()
      scope.$apply ->
        if scope.selected?.id
          found = findNode(scope.selected.id)
          if found
            selectNode(found, true)
            scope.selected = found.original
            scope.loading = false
          else
            searchTree(scope.selected.text)
        else
          scope.loading = !!scope.query

    treeElement.on 'search.jstree', ->
      scope.$apply ->
        if scope.loading
          found = findNode(scope.selected?.id)
          found ||= getSelectedNode()
          if found
            selectNode(found, true)
            scope.selected = found.original
        scope.loading = false

    treeElement.on 'select_node.jstree', (e, data) ->
      scope.$evalAsync ->
        unless scope.loading
          scope.selected = data.node.original
          loadNode(data.node)

    treeElement.on 'load_node.jstree', (e, data) ->
      scope.$apply ->
        if scope.selected && scope.selected.id == data.node.original?.id
          scope.selected.children = _.pluck(_.map(data.node.children, findNode), 'original')

    scope.$watch 'query', $debounce(searchTree, 1000)

    scope.$on '$destroy', -> tree.jstree('destroy')

    init()
])
