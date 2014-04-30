ReportTab = require 'reportTab'
templates = require '../templates/templates.js'
_partials = require '../node_modules/seasketch-reporting-api/templates/templates.js'
partials = []
for key, val of _partials
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val

ids = require './ids.coffee'
for key, value of ids
  window[key] = value

class FishingValueTab extends ReportTab
  name: 'Fishing Value'
  className: 'fishingValue'
  template: templates.fishingValue
  dependencies: ['FishingValue']
  timeout: 120000
  areaLabel: 'protected area'

  render: () ->
    isMooringArea = (@sketchClass.id is MOORING_ID)
    areaLabel = @sketchClass.attributes.name
    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      percent: @recordSet('FishingValue', 'FishingValue').float('PERCENT', 2)
      areaLabel: areaLabel
      isMooringArea: isMooringArea
    
    @$el.html @template.render(context, templates)
    @enableLayerTogglers(@$el)


module.exports = FishingValueTab