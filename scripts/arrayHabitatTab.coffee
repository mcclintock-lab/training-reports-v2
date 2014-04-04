ReportTab = require 'reportTab'
templates = require '../templates/templates.js'
ids = require './ids.coffee'
for key, value of ids
  window[key] = value

class ArrayHabitatTab extends ReportTab
  name: 'Habitat'
  className: 'habitat'
  template: templates.arrayHabitats
  dependencies: ['BarbudaHabitat']
  timeout: 240000
  
  render: () ->

    sanctuaries = @getChildren SANCTUARY_ID
    if sanctuaries.length
      sanctuary = @recordSet('BarbudaHabitat', 'Habitats', SANCTUARY_ID)
        .toArray()
      for row in sanctuary
        if parseFloat(row.Percent) >= 33
          row.meetsGoal = true


    moorings = @getChildren MOORING_ID
    if moorings.length
      mooringData = @recordSet('BarbudaHabitat', 'Habitats', MOORING_ID)
        .toArray()


    noNetZones = @getChildren NO_NET_ZONES_ID
    if noNetZones.length
      noNetZonesData = @recordSet('BarbudaHabitat', 'Habitats', 
        NO_NET_ZONES_ID).toArray()

    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      numSanctuaries: sanctuaries.length
      sanctuaries: sanctuaries.length > 0
      sanctuaryHabitat: sanctuary
      sanctuaryPlural: sanctuaries.length > 1
      
      moorings: moorings.length > 0
      numMoorings: moorings.length
      mooringData: mooringData
      mooringPlural: moorings.length > 1

      hasNoNetZones: noNetZones.length > 0
      numNoNetZones: noNetZones.length
      noNetZonesData: noNetZonesData
      noNetZonesPlural: noNetZones.length > 1

    @$el.html @template.render(context, templates)
    @enableLayerTogglers(@$el)

module.exports = ArrayHabitatTab