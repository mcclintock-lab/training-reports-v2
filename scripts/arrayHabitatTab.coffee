ReportTab = require 'reportTab'
templates = require '../templates/templates.js'
ids = require './ids.coffee'
for key, value of ids
  window[key] = value

class ArrayHabitatTab extends ReportTab
  name: 'Habitat'
  className: 'habitat'
  template: templates.arrayHabitats
  dependencies: [
    'BarbudaHabitat'
    'MarxanAnalysis'
  ]
  timeout: 240000
  
  render: () ->
    data = @recordSet('MarxanAnalysis', 'MarxanAnalysis').toArray()
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
      marxanAnalyses: _.map(@recordSet("MarxanAnalysis", "MarxanAnalysis")
        .toArray(), (f) -> f.NAME)
    
    @$el.html @template.render(context, templates)
    @enableLayerTogglers(@$el)
    @$('.chosen').chosen({disable_search_threshold: 10, width:'400px'})
    @$('.chosen').change () =>
      _.defer @renderMarxanAnalysis

    tooltip = d3.select("body")
      .append("div")
      .attr("class", "chart-tooltip")
      .attr("id", "chart-tooltip")
      .text("data")

    @renderMarxanAnalysis(tooltip)




  calc_ttip = (xloc, data, tooltip) ->
    tdiv = tooltip[0][0].getBoundingClientRect()
    tleft = tdiv.left
    tw = tdiv.width
    return xloc-(tw+10) if (xloc+tw > tleft+tw)
    return xloc+10
    
  renderMarxanAnalysis: () =>
    tooltip = d3.select('.chart-tooltip')
    if window.d3
      pointSelect = null
      labelSelect = null
      name = @$('.chosen').val()

      try
        #hook up the checkboxes for marxan scenario names
        nodeMap = {
            "1":"533de20aa498867c56c6cba5"
            "2":"533de20aa498867c56c6cba7"
            "3":"533de20aa498867c56c6cba9"
            "4":"533de20aa498867c56c6cbab"
            "5":"533de20aa498867c56c6cbad"
            "6":"533de20aa498867c56c6cbaf"
            "7":"533de20aa498867c56c6cbb1"
            "8":"533de20aa498867c56c6cbb3"
          }
        scenarioName = name.substring(0,1)
        nodeId = nodeMap[scenarioName]

        toc = window.app.getToc()
        view = toc.getChildViewById(nodeId)
        node = view.model
        isVisible = node.get('visible')
        @$('.marxan-node').attr('data-toggle-node', nodeId)
        @$('.marxan-node').data('tocItem', view)
        @$('.marxan-node').attr('checked', isVisible)
        @$('.marxan-node').attr('data-visible', isVisible)
        @$('.marxan-node').text('show \'Scenario '+scenarioName+'\' marxan layer')
      catch e
        console.log("error", e)

      records = @recordSet("MarxanAnalysis", "MarxanAnalysis").toArray()
      quantile_range = {"Q0":"very low", "Q20": "low","Q40": "mid","Q60": "high","Q80": "very high"}
      data = _.find records, (record) -> record.NAME is name

      scores_data = []
      proposals_data = []
      for rec in records
         if rec.NAME == name
          scores_data.push(rec)
          proposals_data.push(rec)

      _.sortBy proposals_data, (r) -> window.app.sketches.get(r.SC_ID).attributes.name
      
      histo = data.HISTO.slice(1, data.HISTO.length - 1).split(/\s/)
      histo = _.filter histo, (s) -> s.length > 0
      histo = _.map histo, (val) ->
        parseInt(val)
      quantiles = _.filter(_.keys(data), (key) -> key.indexOf('Q') is 0)
      for q, i in quantiles
        if parseFloat(data[q]) > parseFloat(data.SCORE) or i is quantiles.length - 1
          max_q = quantiles[i]
          min_q = quantiles[i - 1] or "Q0" # quantiles[i]
          quantile_desc = quantile_range[min_q]
          break
          
      scores_table = "<table><thead><tr><th>Proposal</th><th>Score</th><th>Quantile</th><th>Quantile %</tr></thead><tbody>"
      for rec in proposals_data
        rec_name = window.app.sketches.get(rec.SC_ID).attributes.name
        rec_score = rec.SCORE
        scores_table+="<tr><td>#{rec_name}</td><td>#{rec_score}</td><td>#{quantile_desc}</td><td>#{min_q.replace('Q', '')}%-#{max_q.replace('Q', '')}%</td></tr></tbody><table>"
      @$('.proposalResults').html scores_table

      @$('.scenarioDescription').html data.MARX_DESC

      domain = _.map quantiles, (q) -> data[q]
      domain.push 100
      domain.unshift 0
      color = d3.scale.linear()
        .domain(domain)
        .range(["#47ae43", "#6c0", "#ee0", "#eb4", "#ecbb89", "#eeaba0"].reverse())
      quantiles = _.map quantiles, (key) ->
        max = parseFloat(data[key])
        min  = parseFloat(data[quantiles[_.indexOf(quantiles, key) - 1]] or 0)
        {
          range: "#{parseInt(key.replace('Q', '')) - 20}-#{key.replace('Q', '')}%"
          name: key
          start: min
          end: max
          bg: color((max + min) / 2)
        }

      @$('.viz').html('')
      el = @$('.viz')[0]
      x = d3.scale.linear()
        .domain([0, 100])
        .range([0, 400])      

      # Histogram
      margin = 
        top: 5
        right: 20
        bottom: 30
        left: 45
      width = 400 - margin.left - margin.right
      height = 350 - margin.top - margin.bottom

      x = d3.scale.linear()
        .domain([0, 100])
        .range([0, width])
      y = d3.scale.linear()
        .range([height, 0])
        .domain([0, d3.max(histo)+50])

      xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
      yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")

      svg = d3.select(@$('.viz')[0]).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(#{margin.left}, #{margin.top})")

      svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0,#{height})")
        .call(xAxis)
      .append("text")
        .attr("x", width / 2)
        .attr("dy", "3em")
        .style("text-anchor", "middle")
        .text("Score")

      svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Number of Planning Units")

      svg.selectAll(".bar")
          .data(histo)
        .enter().append("rect")
          .attr("class", "bar")
          .attr("x", (d, i) -> x(i))
          .attr("width", (width / 100))
          .attr("y", (d) -> y(d))
          .attr("height", (d) -> height - y(d))
          .style 'fill', (d, i) ->
            q = _.find quantiles, (q) ->
              i >= q.start and i <= q.end
            q?.bg or "steelblue"


      #sort the overlapping scores into a map of scores->array of proposal ids
      score_map  = []
      for sdata in scores_data
        curr_score = Math.round(sdata.SCORE)
        curr_proposal = sdata.PROPOSAL
        scores = Object.keys(score_map)
        if curr_score.toString() in scores
          prop_ids = score_map[curr_score]
          prop_ids.push(curr_proposal)
          score_map[curr_score] = prop_ids
        else
          score_map[curr_score] = [curr_proposal]

      for sdata, proposals of score_map
        svg.selectAll(".score"+sdata)
            .data([sdata])
          .enter().append("text")
          .attr("class", "score")
          .attr("x", (d) -> (x(d) - 8 )+ 'px')
          .attr("y", (d) -> (y(histo[d]) - 1) + 'px')
          .text("▼")
          .style('cursor', 'pointer')
          .on("mouseover", (d) -> show_tooltip(tooltip, d, score_map))
          .on("mouseout", (d) -> hide_tooltip(tooltip))
          .on("mousemove", (d) -> tooltip.style("top", (event.pageY-10)+"px").style("left",(calc_ttip(event.pageX, d, tooltip))+"px"))  

      for sdata, proposals of score_map
        svg.selectAll('.scoreText'+sdata)
            .data([sdata])
          .enter().append("text")
          .attr("class", "scoreText")
          .attr("x", (d) -> (x(d) - 6 )+ 'px')
          .attr("y", (d) -> (y(histo[d]) - 18) + 'px')
          .attr("id", (d) -> "s"+d)
          .style("font-size", '12px')
          .style('cursor', 'pointer')
          .on("mouseover", (d) -> show_tooltip(tooltip, d, score_map))
          .on("mouseout", (d) -> hide_tooltip(tooltip))
          .on("mousemove", (d) -> tooltip.style("top", (event.pageY-10)+"px").style("left",(calc_ttip(event.pageX, d, tooltip))+"px"))          
          .text( (d, props) -> 
            return proposals.length+" Proposals" if (proposals.length > 1)
            return window.app.sketches.get(proposals[0]).attributes.name
          )

      @$('.viz').append '<div class="legends"></div>'
      for quantile in quantiles
        @$('.viz .legends').append """
          <div class="legend"><span style="background-color:#{quantile.bg};">&nbsp;</span>#{quantile.range}</div>
        """
      @$('.viz').append '<br style="clear:both;">'


    show_tooltip = (tooltip, data, score_map) ->
      tooltip.style("visibility", "visible").html(get_proposal_html(data, score_map[data]))
      return

    get_proposal_html = (data, proposals) ->
      if proposals.length == 1
        return "<b>"+window.app.sketches.get(proposals[0]).attributes.name+"</b> has a score of <b>"+data+"</b>"
      else
        msg = "The following proposals have a score of <b>"+data+"</b>:<ul>"
        for p in proposals
          msg+="<li><b>"+window.app.sketches.get(p).attributes.name+"</b></li>"
        msg+="</ul>"
        return msg

    hide_tooltip = (tooltip) ->
      tooltip.style("visibility", "hidden")
      return

    calc_ttip = (xloc, data, tooltip) ->
      tdiv = tooltip[0][0].getBoundingClientRect()
      tleft = tdiv.left
      tw = tdiv.width
      return xloc-(tw+10) if (xloc+tw > tleft+tw)
      return xloc+10

module.exports = ArrayHabitatTab