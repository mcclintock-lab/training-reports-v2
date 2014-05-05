ReportTab = require 'reportTab'
templates = require '../templates/templates.js'
ids = require './ids.coffee'
for key, value of ids
  window[key] = value



class ArrayFishingValueTab extends ReportTab
  name: 'Fishing Value'
  className: 'fishingValue'
  template: templates.arrayFishingValue
  dependencies: ['FishingValue']
  timeout: 240000

  render: () ->
    numTypes = 0
    sanctuaries = @getChildren SANCTUARY_ID
    if sanctuaries.length
      sanctuaryPercent = @recordSet(
        'FishingValue', 
        'FishingValue', 
        SANCTUARY_ID
      ).float('PERCENT', 2)


    moorings = @getChildren MOORING_ID
    if moorings.length
      mooringPercent = @recordSet(
        'FishingValue', 
        'FishingValue', 
        MOORING_ID
      ).float('PERCENT', 2)


    noNetZones = @getChildren NO_NET_ZONES_ID
    if noNetZones.length
      noNetZonesPercent = @recordSet(
        'FishingValue', 
        'FishingValue', 
        NO_NET_ZONES_ID
      ).float('PERCENT', 0)


    shippingZones = @getChildren SHIPPING_ZONE_ID
    if shippingZones.length
      shippingZonesPercent = @recordSet(
        'FishingValue', 
        'FishingValue', 
        SHIPPING_ZONE_ID
      ).float('PERCENT', 0)

    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      sanctuaryPercent: sanctuaryPercent
      numSanctuaries: sanctuaries.length

      hasSanctuaries: sanctuaries?.length > 0
      sancPlural: sanctuaries?.length > 1

      mooringsPercent: mooringPercent
      numMoorings: moorings?.length
      hasMoorings: moorings?.length > 0
      mooringsPlural: moorings?.length > 1

      noNetZonesPercent: noNetZonesPercent
      numNoNetZones: noNetZones?.length
      hasNoNetZones: noNetZones?.length > 0
      noNetZonesPlural: noNetZones?.length > 1

      shippingZonesPercent: shippingZonesPercent
      numShippingZones: shippingZones?.length
      hasShippingZones: shippingZones?.length > 0
      shippingZonesPlural: shippingZones?.length > 1


    @$el.html @template.render(context, templates)
    @enableLayerTogglers(@$el)


module.exports = ArrayFishingValueTab