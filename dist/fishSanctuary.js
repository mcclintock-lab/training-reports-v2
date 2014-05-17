require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
module.exports = function(el) {
  var $el, $toggler, app, e, node, nodeid, toc, toggler, togglers, view, _i, _len, _ref;
  $el = $(el);
  app = window.app;
  toc = app.getToc();
  if (!toc) {
    console.log('No table of contents found');
    return;
  }
  togglers = $el.find('a[data-toggle-node]');
  _ref = togglers.toArray();
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    toggler = _ref[_i];
    $toggler = $(toggler);
    nodeid = $toggler.data('toggle-node');
    try {
      view = toc.getChildViewById(nodeid);
      node = view.model;
      $toggler.attr('data-visible', !!node.get('visible'));
      $toggler.data('tocItem', view);
    } catch (_error) {
      e = _error;
      $toggler.attr('data-not-found', 'true');
    }
  }
  return togglers.on('click', function(e) {
    e.preventDefault();
    $el = $(e.target);
    view = $el.data('tocItem');
    if (view) {
      view.toggleVisibility(e);
      return $el.attr('data-visible', !!view.model.get('visible'));
    } else {
      return alert("Layer not found in the current Table of Contents. \nExpected nodeid " + ($el.data('toggle-node')));
    }
  });
};


},{}],3:[function(require,module,exports){
var JobItem,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

JobItem = (function(_super) {
  __extends(JobItem, _super);

  JobItem.prototype.className = 'reportResult';

  JobItem.prototype.events = {};

  JobItem.prototype.bindings = {
    "h6 a": {
      observe: "serviceName",
      updateView: true,
      attributes: [
        {
          name: 'href',
          observe: 'serviceUrl'
        }
      ]
    },
    ".startedAt": {
      observe: ["startedAt", "status"],
      visible: function() {
        var _ref;
        return (_ref = this.model.get('status')) !== 'complete' && _ref !== 'error';
      },
      updateView: true,
      onGet: function() {
        if (this.model.get('startedAt')) {
          return "Started " + moment(this.model.get('startedAt')).fromNow() + ". ";
        } else {
          return "";
        }
      }
    },
    ".status": {
      observe: "status",
      onGet: function(s) {
        switch (s) {
          case 'pending':
            return "waiting in line";
          case 'running':
            return "running analytical service";
          case 'complete':
            return "completed";
          case 'error':
            return "an error occurred";
          default:
            return s;
        }
      }
    },
    ".queueLength": {
      observe: "queueLength",
      onGet: function(v) {
        var s;
        s = "Waiting behind " + v + " job";
        if (v.length > 1) {
          s += 's';
        }
        return s + ". ";
      },
      visible: function(v) {
        return (v != null) && parseInt(v) > 0;
      }
    },
    ".errors": {
      observe: 'error',
      updateView: true,
      visible: function(v) {
        return (v != null ? v.length : void 0) > 2;
      },
      onGet: function(v) {
        if (v != null) {
          return JSON.stringify(v, null, '  ');
        } else {
          return null;
        }
      }
    }
  };

  function JobItem(model) {
    this.model = model;
    JobItem.__super__.constructor.call(this);
  }

  JobItem.prototype.render = function() {
    this.$el.html("<h6><a href=\"#\" target=\"_blank\"></a><span class=\"status\"></span></h6>\n<div>\n  <span class=\"startedAt\"></span>\n  <span class=\"queueLength\"></span>\n  <pre class=\"errors\"></pre>\n</div>");
    return this.stickit();
  };

  return JobItem;

})(Backbone.View);

module.exports = JobItem;


},{}],4:[function(require,module,exports){
var ReportResults,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportResults = (function(_super) {
  __extends(ReportResults, _super);

  ReportResults.prototype.defaultPollingInterval = 3000;

  function ReportResults(sketch, deps) {
    var url;
    this.sketch = sketch;
    this.deps = deps;
    this.poll = __bind(this.poll, this);
    this.url = url = "/reports/" + this.sketch.id + "/" + (this.deps.join(','));
    ReportResults.__super__.constructor.call(this);
  }

  ReportResults.prototype.poll = function() {
    var _this = this;
    return this.fetch({
      success: function() {
        var payloadSize, problem, result, _i, _len, _ref, _ref1;
        _this.trigger('jobs');
        _ref = _this.models;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          result = _ref[_i];
          if ((_ref1 = result.get('status')) !== 'complete' && _ref1 !== 'error') {
            if (!_this.interval) {
              _this.interval = setInterval(_this.poll, _this.defaultPollingInterval);
            }
            return;
          }
          console.log(_this.models[0].get('payloadSizeBytes'));
          payloadSize = Math.round(((_this.models[0].get('payloadSizeBytes') || 0) / 1024) * 100) / 100;
          console.log("FeatureSet sent to GP weighed in at " + payloadSize + "kb");
        }
        if (_this.interval) {
          window.clearInterval(_this.interval);
        }
        if (problem = _.find(_this.models, function(r) {
          return r.get('error') != null;
        })) {
          return _this.trigger('error', "Problem with " + (problem.get('serviceName')) + " job");
        } else {
          return _this.trigger('finished');
        }
      },
      error: function(e, res, a, b) {
        var json, _ref, _ref1;
        if (res.status !== 0) {
          if ((_ref = res.responseText) != null ? _ref.length : void 0) {
            try {
              json = JSON.parse(res.responseText);
            } catch (_error) {

            }
          }
          if (_this.interval) {
            window.clearInterval(_this.interval);
          }
          return _this.trigger('error', (json != null ? (_ref1 = json.error) != null ? _ref1.message : void 0 : void 0) || 'Problem contacting the SeaSketch server');
        }
      }
    });
  };

  return ReportResults;

})(Backbone.Collection);

module.exports = ReportResults;


},{}],"a21iR2":[function(require,module,exports){
var CollectionView, JobItem, RecordSet, ReportResults, ReportTab, enableLayerTogglers, round, t, templates, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

enableLayerTogglers = require('./enableLayerTogglers.coffee');

round = require('./utils.coffee').round;

ReportResults = require('./reportResults.coffee');

t = require('../templates/templates.js');

templates = {
  reportLoading: t['node_modules/seasketch-reporting-api/reportLoading']
};

JobItem = require('./jobItem.coffee');

CollectionView = require('views/collectionView');

RecordSet = (function() {
  function RecordSet(data, tab, sketchClassId) {
    this.data = data;
    this.tab = tab;
    this.sketchClassId = sketchClassId;
  }

  RecordSet.prototype.toArray = function() {
    var data,
      _this = this;
    if (this.sketchClassId) {
      data = _.find(this.data.value, function(v) {
        var _ref, _ref1, _ref2;
        return ((_ref = v.features) != null ? (_ref1 = _ref[0]) != null ? (_ref2 = _ref1.attributes) != null ? _ref2['SC_ID'] : void 0 : void 0 : void 0) === _this.sketchClassId;
      });
      if (!data) {
        throw "Could not find data for sketchClass " + this.sketchClassId;
      }
    } else {
      if (_.isArray(this.data.value)) {
        data = this.data.value[0];
      } else {
        data = this.data.value;
      }
    }
    return _.map(data.features, function(feature) {
      return feature.attributes;
    });
  };

  RecordSet.prototype.raw = function(attr) {
    var attrs;
    attrs = _.map(this.toArray(), function(row) {
      return row[attr];
    });
    attrs = _.filter(attrs, function(attr) {
      return attr !== void 0;
    });
    if (attrs.length === 0) {
      console.log(this.data);
      this.tab.reportError("Could not get attribute " + attr + " from results");
      throw "Could not get attribute " + attr;
    } else if (attrs.length === 1) {
      return attrs[0];
    } else {
      return attrs;
    }
  };

  RecordSet.prototype.int = function(attr) {
    var raw;
    raw = this.raw(attr);
    if (_.isArray(raw)) {
      return _.map(raw, parseInt);
    } else {
      return parseInt(raw);
    }
  };

  RecordSet.prototype.float = function(attr, decimalPlaces) {
    var raw;
    if (decimalPlaces == null) {
      decimalPlaces = 2;
    }
    raw = this.raw(attr);
    if (_.isArray(raw)) {
      return _.map(raw, function(val) {
        return round(val, decimalPlaces);
      });
    } else {
      return round(raw, decimalPlaces);
    }
  };

  RecordSet.prototype.bool = function(attr) {
    var raw;
    raw = this.raw(attr);
    if (_.isArray(raw)) {
      return _.map(raw, function(val) {
        return val.toString().toLowerCase() === 'true';
      });
    } else {
      return raw.toString().toLowerCase() === 'true';
    }
  };

  return RecordSet;

})();

ReportTab = (function(_super) {
  __extends(ReportTab, _super);

  function ReportTab() {
    this.renderJobDetails = __bind(this.renderJobDetails, this);
    this.startEtaCountdown = __bind(this.startEtaCountdown, this);
    this.reportJobs = __bind(this.reportJobs, this);
    this.showError = __bind(this.showError, this);
    this.reportError = __bind(this.reportError, this);
    this.reportRequested = __bind(this.reportRequested, this);
    this.remove = __bind(this.remove, this);
    _ref = ReportTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  ReportTab.prototype.name = 'Information';

  ReportTab.prototype.dependencies = [];

  ReportTab.prototype.initialize = function(model, options) {
    this.model = model;
    this.options = options;
    this.app = window.app;
    _.extend(this, this.options);
    this.reportResults = new ReportResults(this.model, this.dependencies);
    this.listenToOnce(this.reportResults, 'error', this.reportError);
    this.listenToOnce(this.reportResults, 'jobs', this.renderJobDetails);
    this.listenToOnce(this.reportResults, 'jobs', this.reportJobs);
    this.listenTo(this.reportResults, 'finished', _.bind(this.render, this));
    return this.listenToOnce(this.reportResults, 'request', this.reportRequested);
  };

  ReportTab.prototype.render = function() {
    throw 'render method must be overidden';
  };

  ReportTab.prototype.show = function() {
    var _ref1, _ref2;
    this.$el.show();
    this.visible = true;
    if (((_ref1 = this.dependencies) != null ? _ref1.length : void 0) && !this.reportResults.models.length) {
      return this.reportResults.poll();
    } else if (!((_ref2 = this.dependencies) != null ? _ref2.length : void 0)) {
      this.render();
      return this.$('[data-attribute-type=UrlField] .value, [data-attribute-type=UploadField] .value').each(function() {
        var html, name, text, url, _i, _len, _ref3;
        text = $(this).text();
        html = [];
        _ref3 = text.split(',');
        for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
          url = _ref3[_i];
          if (url.length) {
            name = _.last(url.split('/'));
            html.push("<a target=\"_blank\" href=\"" + url + "\">" + name + "</a>");
          }
        }
        return $(this).html(html.join(', '));
      });
    }
  };

  ReportTab.prototype.hide = function() {
    this.$el.hide();
    return this.visible = false;
  };

  ReportTab.prototype.remove = function() {
    window.clearInterval(this.etaInterval);
    this.stopListening();
    return ReportTab.__super__.remove.call(this);
  };

  ReportTab.prototype.reportRequested = function() {
    return this.$el.html(templates.reportLoading.render({}));
  };

  ReportTab.prototype.reportError = function(msg, cancelledRequest) {
    if (!cancelledRequest) {
      if (msg === 'JOB_ERROR') {
        return this.showError('Error with specific job');
      } else {
        return this.showError(msg);
      }
    }
  };

  ReportTab.prototype.showError = function(msg) {
    this.$('.progress').remove();
    this.$('p.error').remove();
    return this.$('h4').text("An Error Occurred").after("<p class=\"error\" style=\"text-align:center;\">" + msg + "</p>");
  };

  ReportTab.prototype.reportJobs = function() {
    if (!this.maxEta) {
      this.$('.progress .bar').width('100%');
    }
    return this.$('h4').text("Analyzing Designs");
  };

  ReportTab.prototype.startEtaCountdown = function() {
    var _this = this;
    if (this.maxEta) {
      _.delay(function() {
        return _this.reportResults.poll();
      }, (this.maxEta + 1) * 1000);
      return _.delay(function() {
        _this.$('.progress .bar').css('transition-timing-function', 'linear');
        _this.$('.progress .bar').css('transition-duration', "" + (_this.maxEta + 1) + "s");
        return _this.$('.progress .bar').width('100%');
      }, 500);
    }
  };

  ReportTab.prototype.renderJobDetails = function() {
    var item, job, maxEta, _i, _j, _len, _len1, _ref1, _ref2, _results,
      _this = this;
    maxEta = null;
    _ref1 = this.reportResults.models;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      job = _ref1[_i];
      if (job.get('etaSeconds')) {
        if (!maxEta || job.get('etaSeconds') > maxEta) {
          maxEta = job.get('etaSeconds');
        }
      }
    }
    if (maxEta) {
      this.maxEta = maxEta;
      this.$('.progress .bar').width('5%');
      this.startEtaCountdown();
    }
    this.$('[rel=details]').css('display', 'block');
    this.$('[rel=details]').click(function(e) {
      e.preventDefault();
      _this.$('[rel=details]').hide();
      return _this.$('.details').show();
    });
    _ref2 = this.reportResults.models;
    _results = [];
    for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
      job = _ref2[_j];
      item = new JobItem(job);
      item.render();
      _results.push(this.$('.details').append(item.el));
    }
    return _results;
  };

  ReportTab.prototype.getResult = function(id) {
    var result, results;
    results = this.getResults();
    result = _.find(results, function(r) {
      return r.paramName === id;
    });
    if (result == null) {
      throw new Error('No result with id ' + id);
    }
    return result.value;
  };

  ReportTab.prototype.getFirstResult = function(param, id) {
    var e, result;
    result = this.getResult(param);
    try {
      return result[0].features[0].attributes[id];
    } catch (_error) {
      e = _error;
      throw "Error finding " + param + ":" + id + " in gp results";
    }
  };

  ReportTab.prototype.getResults = function() {
    var results;
    results = this.reportResults.map(function(result) {
      return result.get('result').results;
    });
    if (!(results != null ? results.length : void 0)) {
      throw new Error('No gp results');
    }
    return _.filter(results, function(result) {
      var _ref1;
      return (_ref1 = result.paramName) !== 'ResultCode' && _ref1 !== 'ResultMsg';
    });
  };

  ReportTab.prototype.recordSet = function(dependency, paramName, sketchClassId) {
    var dep, param;
    if (sketchClassId == null) {
      sketchClassId = false;
    }
    if (__indexOf.call(this.dependencies, dependency) < 0) {
      throw new Error("Unknown dependency " + dependency);
    }
    dep = this.reportResults.find(function(r) {
      return r.get('serviceName') === dependency;
    });
    if (!dep) {
      console.log(this.reportResults.models);
      throw new Error("Could not find results for " + dependency + ".");
    }
    param = _.find(dep.get('result').results, function(param) {
      return param.paramName === paramName;
    });
    if (!param) {
      console.log(dep.get('data').results);
      throw new Error("Could not find param " + paramName + " in " + dependency);
    }
    return new RecordSet(param, this, sketchClassId);
  };

  ReportTab.prototype.enableTablePaging = function() {
    return this.$('[data-paging]').each(function() {
      var $table, i, noRowsMessage, pageSize, pages, parent, rows, ul, _i, _len, _ref1;
      $table = $(this);
      pageSize = $table.data('paging');
      rows = $table.find('tbody tr').length;
      pages = Math.ceil(rows / pageSize);
      if (pages > 1) {
        $table.append("<tfoot>\n  <tr>\n    <td colspan=\"" + ($table.find('thead th').length) + "\">\n      <div class=\"pagination\">\n        <ul>\n          <li><a href=\"#\">Prev</a></li>\n        </ul>\n      </div>\n    </td>\n  </tr>\n</tfoot>");
        ul = $table.find('tfoot ul');
        _ref1 = _.range(1, pages + 1);
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          i = _ref1[_i];
          ul.append("<li><a href=\"#\">" + i + "</a></li>");
        }
        ul.append("<li><a href=\"#\">Next</a></li>");
        $table.find('li a').click(function(e) {
          var $a, a, n, offset, text;
          e.preventDefault();
          $a = $(this);
          text = $a.text();
          if (text === 'Next') {
            a = $a.parent().parent().find('.active').next().find('a');
            if (a.text() !== 'Next') {
              return a.click();
            }
          } else if (text === 'Prev') {
            a = $a.parent().parent().find('.active').prev().find('a');
            if (a.text() !== 'Prev') {
              return a.click();
            }
          } else {
            $a.parent().parent().find('.active').removeClass('active');
            $a.parent().addClass('active');
            n = parseInt(text);
            $table.find('tbody tr').hide();
            offset = pageSize * (n - 1);
            return $table.find("tbody tr").slice(offset, n * pageSize).show();
          }
        });
        $($table.find('li a')[1]).click();
      }
      if (noRowsMessage = $table.data('no-rows')) {
        if (rows === 0) {
          parent = $table.parent();
          $table.remove();
          parent.removeClass('tableContainer');
          return parent.append("<p>" + noRowsMessage + "</p>");
        }
      }
    });
  };

  ReportTab.prototype.enableLayerTogglers = function() {
    return enableLayerTogglers(this.$el);
  };

  ReportTab.prototype.getChildren = function(sketchClassId) {
    return _.filter(this.children, function(child) {
      return child.getSketchClass().id === sketchClassId;
    });
  };

  return ReportTab;

})(Backbone.View);

module.exports = ReportTab;


},{"../templates/templates.js":"CNqB+b","./enableLayerTogglers.coffee":2,"./jobItem.coffee":3,"./reportResults.coffee":4,"./utils.coffee":"+VosKh","views/collectionView":1}],"reportTab":[function(require,module,exports){
module.exports=require('a21iR2');
},{}],"api/utils":[function(require,module,exports){
module.exports=require('+VosKh');
},{}],"+VosKh":[function(require,module,exports){
module.exports = {
  round: function(number, decimalPlaces) {
    var multiplier;
    if (!_.isNumber(number)) {
      number = parseFloat(number);
    }
    multiplier = Math.pow(10, decimalPlaces);
    return Math.round(number * multiplier) / multiplier;
  }
};


},{}],"api/templates":[function(require,module,exports){
module.exports=require('CNqB+b');
},{}],"CNqB+b":[function(require,module,exports){
this["Templates"] = this["Templates"] || {};

this["Templates"]["node_modules/seasketch-reporting-api/attributes/attributeItem"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<tr data-attribute-id=\"");_.b(_.v(_.f("id",c,p,0)));_.b("\" data-attribute-exportid=\"");_.b(_.v(_.f("exportid",c,p,0)));_.b("\" data-attribute-type=\"");_.b(_.v(_.f("type",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <td class=\"name\">");_.b(_.v(_.f("name",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("  <td class=\"value\">");_.b(_.v(_.f("formattedValue",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("</tr>");_.b("\n");return _.fl();;});

this["Templates"]["node_modules/seasketch-reporting-api/attributes/attributesTable"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<table class=\"attributes\">");_.b("\n" + i);if(_.s(_.f("attributes",c,p,1),c,p,0,44,81,"{{ }}")){_.rs(c,p,function(c,p,_){_.b(_.rp("attributes/attributeItem",c,p,"    "));});c.pop();}_.b("</table>");_.b("\n");return _.fl();;});

this["Templates"]["node_modules/seasketch-reporting-api/genericAttributes"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" Attributes</h4>");_.b("\n" + i);_.b(_.rp("attributes/attributesTable",c,p,"    "));_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

this["Templates"]["node_modules/seasketch-reporting-api/reportLoading"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportLoading\">");_.b("\n" + i);_.b("  <!-- <div class=\"spinner\">3</div> -->");_.b("\n" + i);_.b("  <h4>Requesting Report from Server</h4>");_.b("\n" + i);_.b("  <div class=\"progress progress-striped active\">");_.b("\n" + i);_.b("    <div class=\"bar\" style=\"width: 100%;\"></div>");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("  <a href=\"#\" rel=\"details\">details</a>");_.b("\n" + i);_.b("    <div class=\"details\">");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

module.exports = this["Templates"];
},{}],11:[function(require,module,exports){
var FishingValueTab, HabitatTab, OverviewTab;

OverviewTab = require('./overviewTab.coffee');

HabitatTab = require('./habitatTab.coffee');

FishingValueTab = require('./fishingValue.coffee');

window.app.registerReport(function(report) {
  report.tabs([OverviewTab, HabitatTab, FishingValueTab]);
  return report.stylesheets(['./fishSanctuary.css']);
});


},{"./fishingValue.coffee":12,"./habitatTab.coffee":13,"./overviewTab.coffee":15}],12:[function(require,module,exports){
var FishingValueTab, ReportTab, ids, key, partials, templates, val, value, _partials, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('reportTab');

templates = require('../templates/templates.js');

_partials = require('../node_modules/seasketch-reporting-api/templates/templates.js');

partials = [];

for (key in _partials) {
  val = _partials[key];
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val;
}

ids = require('./ids.coffee');

for (key in ids) {
  value = ids[key];
  window[key] = value;
}

FishingValueTab = (function(_super) {
  __extends(FishingValueTab, _super);

  function FishingValueTab() {
    _ref = FishingValueTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  FishingValueTab.prototype.name = 'Fishing Value';

  FishingValueTab.prototype.className = 'fishingValue';

  FishingValueTab.prototype.template = templates.fishingValue;

  FishingValueTab.prototype.dependencies = ['FishingValue'];

  FishingValueTab.prototype.timeout = 120000;

  FishingValueTab.prototype.areaLabel = 'protected area';

  FishingValueTab.prototype.render = function() {
    var areaLabel, context, isMooringArea, isMooringOrShipping, isShippingArea;
    isMooringArea = this.sketchClass.id === MOORING_ID;
    isShippingArea = this.sketchClass.id === SHIPPING_ZONE_ID;
    isMooringOrShipping = isMooringArea || isShippingArea;
    areaLabel = this.sketchClass.attributes.name;
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user),
      percent: this.recordSet('FishingValue', 'FishingValue').float('PERCENT', 2),
      areaLabel: areaLabel,
      isMooringOrShipping: isMooringOrShipping
    };
    this.$el.html(this.template.render(context, templates));
    return this.enableLayerTogglers(this.$el);
  };

  return FishingValueTab;

})(ReportTab);

module.exports = FishingValueTab;


},{"../node_modules/seasketch-reporting-api/templates/templates.js":"CNqB+b","../templates/templates.js":16,"./ids.coffee":14,"reportTab":"a21iR2"}],13:[function(require,module,exports){
var HabitatTab, ReportTab, templates, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('reportTab');

templates = require('../templates/templates.js');

HabitatTab = (function(_super) {
  __extends(HabitatTab, _super);

  function HabitatTab() {
    this.renderMarxanAnalysis = __bind(this.renderMarxanAnalysis, this);
    _ref = HabitatTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  HabitatTab.prototype.name = 'Habitat';

  HabitatTab.prototype.className = 'habitat';

  HabitatTab.prototype.template = templates.habitat;

  HabitatTab.prototype.dependencies = ['BarbudaHabitat', 'MarxanAnalysis'];

  HabitatTab.prototype.paramName = 'Habitats';

  HabitatTab.prototype.timeout = 120000;

  HabitatTab.prototype.heading = "Habitat Representation";

  HabitatTab.prototype.render = function() {
    var context, data, depName,
      _this = this;
    depName = this.dependencies[0];
    data = this.recordSet(depName, this.paramName).toArray();
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user),
      habitats: data,
      heading: this.heading,
      marxanAnalyses: _.map(this.recordSet("MarxanAnalysis", "MarxanAnalysis").toArray(), function(f) {
        return f.NAME;
      })
    };
    this.$el.html(this.template.render(context, templates));
    this.enableLayerTogglers(this.$el);
    this.$('.chosen').chosen({
      disable_search_threshold: 10,
      width: '400px'
    });
    this.$('.chosen').change(function() {
      return _.defer(_this.renderMarxanAnalysis);
    });
    return this.renderMarxanAnalysis();
  };

  HabitatTab.prototype.renderMarxanAnalysis = function() {
    var color, data, domain, e, el, height, histo, i, isVisible, margin, max_q, min_q, name, node, nodeId, nodeMap, q, quantile, quantile_desc, quantile_range, quantiles, records, scenarioName, svg, toc, view, width, x, xAxis, y, yAxis, _i, _j, _len, _len1;
    if (window.d3) {
      name = this.$('.chosen').val();
      try {
        nodeMap = {
          "1": "533de20aa498867c56c6cba5",
          "2": "533de20aa498867c56c6cba7",
          "3": "533de20aa498867c56c6cba9",
          "4": "533de20aa498867c56c6cbab",
          "5": "533de20aa498867c56c6cbad",
          "6": "533de20aa498867c56c6cbaf",
          "7": "533de20aa498867c56c6cbb1",
          "8": "533de20aa498867c56c6cbb3"
        };
        scenarioName = name.substring(0, 1);
        nodeId = nodeMap[scenarioName];
        toc = window.app.getToc();
        view = toc.getChildViewById(nodeId);
        node = view.model;
        isVisible = node.get('visible');
        this.$('.marxan-node').attr('data-toggle-node', nodeId);
        this.$('.marxan-node').data('tocItem', view);
        this.$('.marxan-node').attr('checked', isVisible);
        this.$('.marxan-node').attr('data-visible', isVisible);
        this.$('.marxan-node').text('show \'Scenario ' + scenarioName + '\' marxan layer');
      } catch (_error) {
        e = _error;
        console.log("error", e);
      }
      records = this.recordSet("MarxanAnalysis", "MarxanAnalysis").toArray();
      quantile_range = {
        "Q0": "very low",
        "Q20": "low",
        "Q40": "mid",
        "Q60": "high",
        "Q80": "very high"
      };
      data = _.find(records, function(record) {
        return record.NAME === name;
      });
      histo = data.HISTO.slice(1, data.HISTO.length - 1).split(/\s/);
      histo = _.filter(histo, function(s) {
        return s.length > 0;
      });
      histo = _.map(histo, function(val) {
        return parseInt(val);
      });
      quantiles = _.filter(_.keys(data), function(key) {
        return key.indexOf('Q') === 0;
      });
      for (i = _i = 0, _len = quantiles.length; _i < _len; i = ++_i) {
        q = quantiles[i];
        if (parseFloat(data[q]) > parseFloat(data.SCORE) || i === quantiles.length - 1) {
          max_q = quantiles[i];
          min_q = quantiles[i - 1] || "Q0";
          quantile_desc = quantile_range[min_q];
          break;
        }
      }
      this.$('.scenarioResults').html("<a href=\"http://www.uq.edu.au/marxan/\" target=\"_blank\" >Marxan</a> is conservation planning software that provides decision support for a range of conservation planning problems. \nIn this analysis, the goal is to maximize the amount of habitat conserved. The score for a 200 square meter planning unit is the number of times it is selected in 100 runs, \nwith higher scores indicating greater conservation value. The average Marxan score for this zone is <strong>" + data.SCORE + "</strong>, placing it in \nthe <strong>" + quantile_desc + "</strong> quantile range <strong>(" + (min_q.replace('Q', '')) + "% - " + (max_q.replace('Q', '')) + "%)</strong> \nfor this region. The graph below shows the distribution of scores for all planning units within this project.");
      this.$('.scenarioDescription').html(data.MARX_DESC);
      domain = _.map(quantiles, function(q) {
        return data[q];
      });
      domain.push(100);
      domain.unshift(0);
      color = d3.scale.linear().domain(domain).range(["#47ae43", "#6c0", "#ee0", "#eb4", "#ecbb89", "#eeaba0"].reverse());
      quantiles = _.map(quantiles, function(key) {
        var max, min;
        max = parseFloat(data[key]);
        min = parseFloat(data[quantiles[_.indexOf(quantiles, key) - 1]] || 0);
        return {
          range: "" + (parseInt(key.replace('Q', '')) - 20) + "-" + (key.replace('Q', '')) + "%",
          name: key,
          start: min,
          end: max,
          bg: color((max + min) / 2)
        };
      });
      this.$('.viz').html('');
      el = this.$('.viz')[0];
      x = d3.scale.linear().domain([0, 100]).range([0, 400]);
      margin = {
        top: 5,
        right: 20,
        bottom: 30,
        left: 45
      };
      width = 400 - margin.left - margin.right;
      height = 300 - margin.top - margin.bottom;
      x = d3.scale.linear().domain([0, 100]).range([0, width]);
      y = d3.scale.linear().range([height, 0]).domain([0, d3.max(histo)]);
      xAxis = d3.svg.axis().scale(x).orient("bottom");
      yAxis = d3.svg.axis().scale(y).orient("left");
      svg = d3.select(this.$('.viz')[0]).append("svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + ", " + margin.top + ")");
      svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis).append("text").attr("x", width / 2).attr("dy", "3em").style("text-anchor", "middle").text("Score");
      svg.append("g").attr("class", "y axis").call(yAxis).append("text").attr("transform", "rotate(-90)").attr("y", 6).attr("dy", ".71em").style("text-anchor", "end").text("Number of Planning Units");
      svg.selectAll(".bar").data(histo).enter().append("rect").attr("class", "bar").attr("x", function(d, i) {
        return x(i);
      }).attr("width", width / 100).attr("y", function(d) {
        return y(d);
      }).attr("height", function(d) {
        return height - y(d);
      }).style('fill', function(d, i) {
        q = _.find(quantiles, function(q) {
          return i >= q.start && i <= q.end;
        });
        return (q != null ? q.bg : void 0) || "steelblue";
      });
      svg.selectAll(".score").data([Math.round(data.SCORE)]).enter().append("text").attr("class", "score").attr("x", function(d) {
        return (x(d) - 8) + 'px';
      }).attr("y", function(d) {
        return (y(histo[d]) - 10) + 'px';
      }).text("▼");
      svg.selectAll(".scoreText").data([Math.round(data.SCORE)]).enter().append("text").attr("class", "scoreText").attr("x", function(d) {
        return (x(d) - 6) + 'px';
      }).attr("y", function(d) {
        return (y(histo[d]) - 30) + 'px';
      }).text(function(d) {
        return d;
      });
      this.$('.viz').append('<div class="legends"></div>');
      for (_j = 0, _len1 = quantiles.length; _j < _len1; _j++) {
        quantile = quantiles[_j];
        this.$('.viz .legends').append("<div class=\"legend\"><span style=\"background-color:" + quantile.bg + ";\">&nbsp;</span>" + quantile.range + "</div>");
      }
      return this.$('.viz').append('<br style="clear:both;">');
    }
  };

  return HabitatTab;

})(ReportTab);

module.exports = HabitatTab;


},{"../templates/templates.js":16,"reportTab":"a21iR2"}],14:[function(require,module,exports){
module.exports = {
  SANCTUARY_ID: '533de96ba498867c56c6d1c5',
  AQUACULTURE_ID: '520bb1c00bd22c9b2147b99b',
  MOORING_ID: '533de4e3a498867c56c6cd45',
  NO_NET_ZONES_ID: '533de620a498867c56c6cfc2',
  SHIPPING_ZONE_ID: '533deca7a498867c56c6d55f'
};


},{}],15:[function(require,module,exports){
var OverviewTab, RECOMMENDED_DIAMETER, ReportTab, TOTAL_AREA, ids, key, partials, round, templates, val, value, _partials, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('reportTab');

templates = require('../templates/templates.js');

_partials = require('../node_modules/seasketch-reporting-api/templates/templates.js');

partials = [];

for (key in _partials) {
  val = _partials[key];
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val;
}

round = require('api/utils').round;

ids = require('./ids.coffee');

for (key in ids) {
  value = ids[key];
  window[key] = value;
}

TOTAL_AREA = 175.95;

RECOMMENDED_DIAMETER = {
  min: 2,
  max: 3
};

OverviewTab = (function(_super) {
  __extends(OverviewTab, _super);

  function OverviewTab() {
    _ref = OverviewTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  OverviewTab.prototype.name = 'Size';

  OverviewTab.prototype.className = 'overview';

  OverviewTab.prototype.template = templates.overview;

  OverviewTab.prototype.dependencies = ['Diameter'];

  OverviewTab.prototype.timeout = 60000;

  OverviewTab.prototype.render = function() {
    var DIAM_OK, MIN_DIAM, PERCENT, SQ_MILES, context, isMooringArea, isNoNetZone, isShippingZone, renderMinimumWidth, skid, _ref1;
    MIN_DIAM = this.recordSet('Diameter', 'Diameter').float('MIN_DIAM');
    SQ_MILES = this.recordSet('Diameter', 'Diameter').float('SQ_MILES');
    PERCENT = (SQ_MILES / TOTAL_AREA) * 100.0;
    if (MIN_DIAM > RECOMMENDED_DIAMETER.min) {
      DIAM_OK = true;
    }
    skid = this.model.getAttribute('SC_ID');
    isNoNetZone = this.sketchClass.id === NO_NET_ZONES_ID;
    isMooringArea = this.sketchClass.id === MOORING_ID;
    isShippingZone = this.sketchClass.id === SHIPPING_ZONE_ID;
    renderMinimumWidth = !isNoNetZone && !isMooringArea && !isShippingZone;
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      anyAttributes: this.model.getAttributes().length > 0,
      admin: this.project.isAdmin(window.user),
      description: this.model.getAttribute('DESCRIPTION'),
      hasDescription: ((_ref1 = this.model.getAttribute('DESCRIPTION')) != null ? _ref1.length : void 0) > 0,
      DIAM_OK: DIAM_OK,
      SQ_MILES: SQ_MILES,
      DIAM: MIN_DIAM,
      MIN_DIAM: RECOMMENDED_DIAMETER.min,
      renderMinimumWidth: renderMinimumWidth,
      PERCENT: round(PERCENT, 0),
      isNoNetZone: isNoNetZone,
      isMooringArea: isMooringArea
    };
    this.$el.html(this.template.render(context, partials));
    if (renderMinimumWidth) {
      this.enableLayerTogglers(this.$el);
      return this.drawViz(MIN_DIAM);
    }
  };

  OverviewTab.prototype.drawViz = function(diam) {
    var chart, el, maxScale, ranges, x;
    if (window.d3) {
      el = this.$('.viz')[0];
      maxScale = d3.max([RECOMMENDED_DIAMETER.max * 1.2, diam * 1.2]);
      ranges = [
        {
          name: 'Below recommended',
          start: 0,
          end: RECOMMENDED_DIAMETER.min,
          bg: "#8e5e50",
          "class": 'below'
        }, {
          name: 'Recommended',
          start: RECOMMENDED_DIAMETER.min,
          end: RECOMMENDED_DIAMETER.max,
          bg: '#588e3f',
          "class": 'recommended'
        }, {
          name: 'Above recommended',
          start: RECOMMENDED_DIAMETER.max,
          end: maxScale,
          "class": 'above'
        }
      ];
      x = d3.scale.linear().domain([0, maxScale]).range([0, 400]);
      chart = d3.select(el);
      chart.selectAll("div.range").data(ranges).enter().append("div").style("width", function(d) {
        return x(d.end - d.start) + 'px';
      }).attr("class", function(d) {
        return "range " + d["class"];
      }).append("span").text(function(d) {
        if (x(d.end - d.start) > 110) {
          return d.name;
        } else {
          return '';
        }
      }).append("span").text(function(d) {
        if (d["class"] === 'above') {
          return "> " + d.start + " miles";
        } else {
          return "" + d.start + "-" + d.end + " miles";
        }
      });
      return chart.selectAll("div.diam").data([diam]).enter().append("div").attr("class", "diam").style("left", function(d) {
        return x(d) + 'px';
      }).text(function(d) {
        return "";
      });
    }
  };

  return OverviewTab;

})(ReportTab);

module.exports = OverviewTab;


},{"../node_modules/seasketch-reporting-api/templates/templates.js":"CNqB+b","../templates/templates.js":16,"./ids.coffee":14,"api/utils":"+VosKh","reportTab":"a21iR2"}],16:[function(require,module,exports){
this["Templates"] = this["Templates"] || {};
this["Templates"]["aquacultureFishingValue"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Fishing Value</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This aquaculture area displaces <strong>");_.b(_.v(_.f("percent",c,p,0)));_.b("%</strong> ");_.b("\n" + i);_.b("    of the fishing value within Barbuda’s waters, based on user reported");_.b("\n" + i);_.b("    values of fishing grounds.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <a href=\"#\" data-toggle-node=\"533f16f6a498867c56c6fb57\">show fishing values layer</a>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});
this["Templates"]["arrayFishingValue"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Displaced Fishing Value</h4>");_.b("\n" + i);if(_.s(_.f("hasSanctuaries",c,p,1),c,p,0,86,461,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("        <p class=\"large\">");_.b("\n" + i);_.b("            This proposal includes <strong>");_.b(_.v(_.f("numSanctuaries",c,p,0)));_.b("\n" + i);_.b("            ");if(_.s(_.f("sancPlural",c,p,1),c,p,0,202,213,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("Sanctuaries");});c.pop();}if(!_.s(_.f("sancPlural",c,p,1),c,p,1,0,0,"")){_.b("Sanctuary");};_.b("</strong>,");_.b("\n" + i);_.b("            displacing <strong>");_.b(_.v(_.f("sanctuaryPercent",c,p,0)));_.b("%</strong> of fishing value within ");_.b("\n" + i);_.b("            Barbuda's waters based on user reported values of fishing grounds.");_.b("\n" + i);_.b("        </p>");_.b("\n");});c.pop();}if(_.s(_.f("hasNoNetZones",c,p,1),c,p,0,503,905,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("        <p class=\"large\">");_.b("\n" + i);_.b("            This proposal includes <strong>");_.b(_.v(_.f("numNoNetZones",c,p,0)));_.b("\n" + i);_.b("            ");if(_.s(_.f("noNetZonesPlural",c,p,1),c,p,0,624,636,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("No-Net Zones");});c.pop();}if(!_.s(_.f("noNetZonesPlural",c,p,1),c,p,1,0,0,"")){_.b("No-Net Zone");};_.b("</strong>,");_.b("\n" + i);_.b("            displacing <strong>");_.b(_.v(_.f("noNetZonesPercent",c,p,0)));_.b("%</strong> of fishing value within ");_.b("\n" + i);_.b("            Barbuda's waters based on user reported values of fishing grounds.");_.b("\n" + i);_.b("        </p>");_.b("\n");});c.pop();}if(_.s(_.f("hasMoorings",c,p,1),c,p,0,944,1320,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("        <p class=\"large\">");_.b("\n" + i);_.b("            This proposal includes <strong>");_.b(_.v(_.f("numMoorings",c,p,0)));_.b("\n" + i);_.b("            Mooring and Anchorage Zone");if(_.s(_.f("mooringsPlural",c,p,1),c,p,0,1087,1088,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</strong>,");_.b("\n" + i);_.b("            which may potentially displace <strong>");_.b(_.v(_.f("mooringsPercent",c,p,0)));_.b("%</strong> of fishing value within ");_.b("\n" + i);_.b("            Barbuda's waters based on user reported values of fishing grounds.");_.b("\n" + i);_.b("        </p>");_.b("\n");});c.pop();}if(_.s(_.f("hasShippingZones",c,p,1),c,p,0,1362,1745,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("        <p class=\"large\">");_.b("\n" + i);_.b("            This proposal includes <strong>");_.b(_.v(_.f("numShippingZones",c,p,0)));_.b("\n" + i);_.b("            Shipping Zone");if(_.s(_.f("shippingZonesPlural",c,p,1),c,p,0,1502,1503,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</strong>,");_.b("\n" + i);_.b("            which may potentially displace <strong>");_.b(_.v(_.f("shippingZonesPercent",c,p,0)));_.b("%</strong> of fishing value within ");_.b("\n" + i);_.b("            Barbuda's waters based on user reported values of fishing grounds.");_.b("\n" + i);_.b("        </p>");_.b("\n");});c.pop();}_.b("  </p>");_.b("\n" + i);_.b("  <a href=\"#\" data-toggle-node=\"533f16f6a498867c56c6fb57\">show fishing values layer</a>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});
this["Templates"]["arrayHabitats"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.f("sanctuaries",c,p,1),c,p,0,16,919,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Habitats within ");_.b(_.v(_.f("numSanctuaries",c,p,0)));_.b(" ");if(!_.s(_.f("sanctuaryPlural",c,p,1),c,p,1,0,0,"")){_.b("Sanctuary");};if(_.s(_.f("sanctuaryPlural",c,p,1),c,p,0,170,181,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("Sanctuaries");});c.pop();}_.b("</h4>");_.b("\n" + i);_.b("  <table>");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Habitat</th>");_.b("\n" + i);_.b("        <th>Percent of Total Habitat</th>");_.b("\n" + i);_.b("        <th>Meets 33% goal</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("sanctuaryHabitat",c,p,1),c,p,0,403,616,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr class=\"");if(_.s(_.f("meetsGoal",c,p,1),c,p,0,435,442,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("metGoal");});c.pop();}_.b("\">");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HabType",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Percent",c,p,0)));_.b(" %</td>");_.b("\n" + i);_.b("        <td>");if(_.s(_.f("meetsGoal",c,p,1),c,p,0,545,548,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("yes");});c.pop();}if(!_.s(_.f("meetsGoal",c,p,1),c,p,1,0,0,"")){_.b("no");};_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    Percentages shown represent the proportion of habitats available in ");_.b("\n" + i);_.b("    Barbuda's entire 3 nautical mile boundary captured within sanctuaries. <br>");_.b("\n" + i);_.b("    <a href=\"#\" data-toggle-node=\"533ddf86a498867c56c6c830\">show habitats layer</a>");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);if(_.s(_.f("moorings",c,p,1),c,p,0,950,1561,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Habitats within ");_.b(_.v(_.f("numMoorings",c,p,0)));_.b(" Mooring Area");if(_.s(_.f("mooringPlural",c,p,1),c,p,0,1062,1063,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</h4>");_.b("\n" + i);_.b("  <table>");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Habitat</th>");_.b("\n" + i);_.b("        <th>Percent of Total Habitat</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("mooringData",c,p,1),c,p,0,1246,1336,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HabType",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Percent",c,p,0)));_.b(" %</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("<!--   <p>");_.b("\n" + i);_.b("    Percentages shown represent the proportion of habitats available in ");_.b("\n" + i);_.b("    Barbuda's entire 3 nautical mile boundary captured within mooring ");_.b("\n" + i);_.b("    areas.");_.b("\n" + i);_.b("  </p> -->");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);if(_.s(_.f("hasNoNetZones",c,p,1),c,p,0,1594,2212,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Habitats within ");_.b(_.v(_.f("numNoNetZones",c,p,0)));_.b(" No Net Zone");if(_.s(_.f("noNetZonesPlural",c,p,1),c,p,0,1710,1711,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</h4>");_.b("\n" + i);_.b("  <table>");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Habitat</th>");_.b("\n" + i);_.b("        <th>Percent of Total Habitat</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("noNetZonesData",c,p,1),c,p,0,1900,1990,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HabType",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Percent",c,p,0)));_.b(" %</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <p>");_.b("\n" + i);_.b("    Percentages shown represent the proportion of habitats available in ");_.b("\n" + i);_.b("    Barbuda's entire 3 nautical mile boundary captured within no net zones.");_.b("\n" + i);_.b("  </p> -->");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Marxan Analysis <a style=\"top:0px;\" class=\"marxan-node\" href=\"#\" data-toggle-node=\"533de20aa498867c56c6cba5\">Show 'Scenario 1' Marxan Layer</a>&nbsp</h4>");_.b("\n" + i);_.b("  <select class=\"chosen\" width=\"400px\">");_.b("\n" + i);if(_.s(_.f("marxanAnalyses",c,p,1),c,p,0,2482,2537,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <option value=\"");_.b(_.v(_.d(".",c,p,0)));_.b("\">Scenario ");_.b(_.v(_.d(".",c,p,0)));_.b("</option>");_.b("\n");});c.pop();}_.b("  </select>");_.b("\n" + i);_.b("  <p class=\"scenarioResults\"></p>");_.b("\n" + i);_.b("  <div class=\"viz\"></div>");_.b("\n" + i);_.b("  <p class=\"scenarioDescription\"></p>");_.b("\n" + i);_.b("</div>");return _.fl();;});
this["Templates"]["arrayOverview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<div class=\"reportSection size\">");_.b("\n" + i);_.b("  <h4>Size</h4>");_.b("\n" + i);if(_.s(_.f("hasSketches",c,p,1),c,p,0,363,874,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p class=\"large\">");_.b("\n" + i);_.b("    This collection is composed of <strong>");_.b(_.v(_.f("numSketches",c,p,0)));_.b(" zone");if(_.s(_.f("sketchesPlural",c,p,1),c,p,0,468,469,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</strong> in both ocean and lagoon waters. The collection includes a total <em>oceanic</em> area of <strong>");_.b(_.v(_.f("sumOceanArea",c,p,0)));_.b(" square miles</strong>, which represents <strong>");_.b(_.v(_.f("sumOceanPercent",c,p,0)));_.b("%</strong> of Barbuda's waters. It also incorporates ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("sumLagoonArea",c,p,0)));_.b(" square miles</strong>, or <strong>");_.b(_.v(_.f("sumLagoonPercent",c,p,0)));_.b("%</strong>, of the total <em>lagoon area</em>.");_.b("\n" + i);_.b("  </p>");_.b("\n");});c.pop();}if(_.s(_.f("hasSanctuaries",c,p,1),c,p,0,914,1653,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p class=\"large\">");_.b("\n" + i);_.b("    The collection includes <strong>");_.b(_.v(_.f("numSanctuaries",c,p,0)));_.b(" ");if(!_.s(_.f("sanctuariesPlural",c,p,1),c,p,1,0,0,"")){_.b("sanctuary");};if(_.s(_.f("sanctuariesPlural",c,p,1),c,p,0,1067,1078,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("sanctuaries");});c.pop();}_.b("</strong> in both ocean and lagoon waters. The ");if(!_.s(_.f("sanctuariesPlural",c,p,1),c,p,1,0,0,"")){_.b("sanctuary");};if(_.s(_.f("sanctuariesPlural",c,p,1),c,p,0,1222,1233,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("sanctuaries");});c.pop();}_.b(" contain");if(!_.s(_.f("sanctuariesPlural",c,p,1),c,p,1,0,0,"")){_.b("s");};_.b(" a total <em>oceanic</em> area of <strong>");_.b(_.v(_.f("sanctuaryOceanArea",c,p,0)));_.b(" square miles</strong>, ");_.b("\n" + i);_.b("    which represents <strong>");_.b(_.v(_.f("sanctuaryOceanPercent",c,p,0)));_.b("%</strong> of Barbuda's waters. It also includes ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("sanctuaryLagoonArea",c,p,0)));_.b(" square miles</strong>, or <strong>");_.b(_.v(_.f("sanctuaryLagoonPercent",c,p,0)));_.b("%</strong>, of the total <em>lagoon area</em>.");_.b("\n" + i);_.b("  </p>");_.b("\n");});c.pop();}if(_.s(_.f("hasNoNetZones",c,p,1),c,p,0,1693,2329,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p class=\"large\">");_.b("\n" + i);_.b("    The collection includes <strong>");_.b(_.v(_.f("numNoNetZones",c,p,0)));_.b(" No Net Zone");if(_.s(_.f("noNetZonesPlural",c,p,1),c,p,0,1802,1803,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</strong> in both ocean and lagoon waters. The No Net Zone");if(_.s(_.f("noNetZonesPlural",c,p,1),c,p,0,1903,1904,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</strong> contain");if(!_.s(_.f("noNetZonesPlural",c,p,1),c,p,1,0,0,"")){_.b("s");};_.b(" a total <em>oceanic</em> area of <strong>");_.b(_.v(_.f("noNetZonesOceanArea",c,p,0)));_.b(" square miles</strong>, which represents <strong>");_.b(_.v(_.f("noNetZonesOceanPercent",c,p,0)));_.b("%</strong> of Barbuda's waters. It also includes ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("noNetZonesLagoonArea",c,p,0)));_.b(" square miles</strong>, or <strong>");_.b(_.v(_.f("noNetZonesLagoonPercent",c,p,0)));_.b("%</strong>, of the total <em>lagoon area</em>.");_.b("\n" + i);_.b("  </p>");_.b("\n");});c.pop();}if(_.s(_.f("hasMoorings",c,p,1),c,p,0,2366,2978,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p class=\"large\">");_.b("\n" + i);_.b("    The collection includes <strong>");_.b(_.v(_.f("numMoorings",c,p,0)));_.b(" Mooring Area");if(_.s(_.f("mooringsPlural",c,p,1),c,p,0,2472,2473,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</strong> in both ocean and lagoon waters. The Mooring Area");if(_.s(_.f("mooringsPlural",c,p,1),c,p,0,2570,2571,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b(" contain");if(!_.s(_.f("mooringsPlural",c,p,1),c,p,1,0,0,"")){_.b("s");};_.b(" a total <em>oceanic</em> area of <strong>");_.b(_.v(_.f("mooringsOceanArea",c,p,0)));_.b(" square miles</strong>, ");_.b("\n" + i);_.b("    which represents <strong>");_.b(_.v(_.f("mooringsOceanPercent",c,p,0)));_.b("%</strong> of Barbuda's waters. It also includes ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("mooringsLagoonArea",c,p,0)));_.b(" square miles</strong>, or <strong>");_.b(_.v(_.f("mooringsLagoonPercent",c,p,0)));_.b("%</strong>, of the total <em>lagoon area</em>.");_.b("\n" + i);_.b("  </p>");_.b("\n");});c.pop();}if(_.s(_.f("hasAquaculture",c,p,1),c,p,0,3016,3664,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p class=\"large\">");_.b("\n" + i);_.b("    The collection includes <strong>");_.b(_.v(_.f("numAquaculture",c,p,0)));_.b(" Aquaculture Area");if(_.s(_.f("aquaculturePlural",c,p,1),c,p,0,3132,3133,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</strong> in both ocean and lagoon waters. The Aquaculture Area");if(_.s(_.f("aquaculturePlural",c,p,1),c,p,0,3240,3241,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b(" contain");if(!_.s(_.f("aquaculturePlural",c,p,1),c,p,1,0,0,"")){_.b("s");};_.b(" a total <em>oceanic</em> area of <strong>");_.b(_.v(_.f("aquacultureOceanArea",c,p,0)));_.b(" square miles</strong>, which represents <strong>");_.b(_.v(_.f("aquacultureOceanPercent",c,p,0)));_.b("%</strong> of Barbuda's waters. It also includes ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("aquacultureLagoonArea",c,p,0)));_.b(" square miles</strong>, or <strong>");_.b(_.v(_.f("aquacultureLagoonPercent",c,p,0)));_.b("%</strong>, of the total <em>lagoon area</em>.");_.b("\n" + i);_.b("  </p>");_.b("\n");});c.pop();}if(_.s(_.f("hasFishingAreas",c,p,1),c,p,0,3706,4375,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p class=\"large\">");_.b("\n" + i);_.b("    The collection includes <strong>");_.b(_.v(_.f("numFishingAreas",c,p,0)));_.b(" Fishing Priority Area");if(_.s(_.f("fishingAreasPlural",c,p,1),c,p,0,3829,3830,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</strong> in both ocean and lagoon waters. The Fishing Priority Area");if(_.s(_.f("fishingAreasPlural",c,p,1),c,p,0,3944,3945,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b(" contain");if(!_.s(_.f("fishingAreasPlural",c,p,1),c,p,1,0,0,"")){_.b("s");};_.b(" a total <em>oceanic</em> area of <strong>");_.b(_.v(_.f("fishingAreasOceanArea",c,p,0)));_.b(" square miles</strong>, which represents <strong>");_.b(_.v(_.f("fishingAreasOceanPercent",c,p,0)));_.b("%</strong> of Barbuda's waters. It also includes ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("fishingAreasLagoonArea",c,p,0)));_.b(" square miles</strong>, or <strong>");_.b(_.v(_.f("fishingAreasLagoonPercent",c,p,0)));_.b("%</strong>, of the total <em>lagoon area</em>.");_.b("\n" + i);_.b("  </p>");_.b("\n");});c.pop();}_.b("</div>");_.b("\n" + i);_.b("<!--");_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Zones in this Proposal</h4>");_.b("\n" + i);_.b("  <div class=\"tocContainer\"></div>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("-->");_.b("\n" + i);if(_.s(_.f("anyAttributes",c,p,1),c,p,0,4534,4658,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" Attributes</h4>");_.b("\n" + i);_.b(_.rp("attributes/attributesTable",c,p,"  "));_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}return _.fl();;});
this["Templates"]["arrayTradeoffs"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Tradeoffs</h4>");_.b("\n" + i);_.b("  	<p class=\"large\" style=\"margin-left:15px;\">");_.b("\n" + i);_.b("  		<a href = \"http://mcclintock.msi.ucsb.edu/blog/tradeoff-analyses-in-seasketch\" target=\"_blank\">Tradeoff Analysis</a> examines the impact of lobster and conch fishing on relative ecological and fishing values. Preventing fishing in an area generally");_.b("\n" + i);_.b("  		increases the ecological score by reducing impacts and decreases fishing values by reducing fishing take. Stopping fishing in some areas, such as nursery grounds, can");_.b("\n" + i);_.b("  		increase both scores by reducing ecological impacts and increasing fish stocks. ");_.b("\n" + i);_.b("  	</p>");_.b("\n" + i);_.b("	<p class=\"small ttip-tip\">");_.b("\n" + i);_.b("	   Tip: hover over a proposal to see details");_.b("\n" + i);_.b("	</p>");_.b("\n" + i);_.b("  	<div  id=\"tradeoff-chart\" class=\"tradeoff-chart\"></div>");_.b("\n" + i);_.b("</div>");return _.fl();;});
this["Templates"]["demo"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Report Sections</h4>");_.b("\n" + i);_.b("  <p>Use report sections to group information into meaningful categories</p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>D3 Visualizations</h4>");_.b("\n" + i);_.b("  <ul class=\"nav nav-pills\" id=\"tabs2\">");_.b("\n" + i);_.b("    <li class=\"active\"><a href=\"#chart\">Chart</a></li>");_.b("\n" + i);_.b("    <li><a href=\"#dataTable\">Table</a></li>");_.b("\n" + i);_.b("  </ul>");_.b("\n" + i);_.b("  <div class=\"tab-content\">");_.b("\n" + i);_.b("    <div class=\"tab-pane active\" id=\"chart\">");_.b("\n" + i);_.b("      <!--[if IE 8]>");_.b("\n" + i);_.b("      <p class=\"unsupported\">");_.b("\n" + i);_.b("      This visualization is not compatible with Internet Explorer 8. ");_.b("\n" + i);_.b("      Please upgrade your browser, or view results in the table tab.");_.b("\n" + i);_.b("      </p>      ");_.b("\n" + i);_.b("      <![endif]-->");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        See <code>src/scripts/demo.coffee</code> for an example of how to ");_.b("\n" + i);_.b("        use d3.js to render visualizations. Provide a table-based view");_.b("\n" + i);_.b("        and use conditional comments to provide a fallback for IE8 users.");_.b("\n" + i);_.b("        <br>");_.b("\n" + i);_.b("        <a href=\"http://twitter.github.io/bootstrap/2.3.2/\">Bootstrap 2.x</a>");_.b("\n" + i);_.b("        is loaded within SeaSketch so you can use it to create tabs and other ");_.b("\n" + i);_.b("        interface components. jQuery and underscore are also available.");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("    </div>");_.b("\n" + i);_.b("    <div class=\"tab-pane\" id=\"dataTable\">");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>index</th>");_.b("\n" + i);_.b("            <th>value</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("chartData",c,p,1),c,p,0,1351,1418,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr><td>");_.b(_.v(_.f("index",c,p,0)));_.b("</td><td>");_.b(_.v(_.f("value",c,p,0)));_.b("</td></tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("    </div>");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection emphasis\">");_.b("\n" + i);_.b("  <h4>Emphasis</h4>");_.b("\n" + i);_.b("  <p>Give report sections an <code>emphasis</code> class to highlight important information.</p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection warning\">");_.b("\n" + i);_.b("  <h4>Warning</h4>");_.b("\n" + i);_.b("  <p>Or <code>warn</code> of potential problems.</p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection danger\">");_.b("\n" + i);_.b("  <h4>Danger</h4>");_.b("\n" + i);_.b("  <p><code>danger</code> can also be used... sparingly.</p>");_.b("\n" + i);_.b("</div>");return _.fl();;});
this["Templates"]["fishingPriorityArea"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Fishing Value</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This fishing priority area includes <strong>");_.b(_.v(_.f("percent",c,p,0)));_.b("%</strong> of the ");_.b("\n" + i);_.b("    fishing value within Barbuda's waters, based on user reported values of ");_.b("\n" + i);_.b("    fishing grounds");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <a href=\"#\" data-toggle-node=\"533f16f6a498867c56c6fb57\">show fishing values layer</a>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});
this["Templates"]["fishingValue"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Fishing Value</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This <strong>");_.b(_.v(_.f("areaLabel",c,p,0)));_.b("</strong> ");if(_.s(_.f("isMooringOrShipping",c,p,1),c,p,0,137,161,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("may potentially displace");});c.pop();}_.b(" ");if(!_.s(_.f("isMooringOrShipping",c,p,1),c,p,1,0,0,"")){_.b("displaces");};_.b(" ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("percent",c,p,0)));_.b("%</strong> of the fishing value within Barbuda’s waters, based on user reported");_.b("\n" + i);_.b("    values of fishing grounds.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <a href=\"#\" data-toggle-node=\"533f16f6a498867c56c6fb57\">show fishing values layer</a>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});
this["Templates"]["habitat"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>");_.b(_.v(_.f("heading",c,p,0)));_.b(" <a href=\"#\" style=\"top:0px;\" data-toggle-node=\"533ddf86a498867c56c6c830\">show habitats layer</a></h4>");_.b("\n" + i);_.b("  <table>");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Habitat</th>");_.b("\n" + i);_.b("        <th>% of Total Habitat</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("habitats",c,p,1),c,p,0,313,376,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr><td>");_.b(_.v(_.f("HabType",c,p,0)));_.b("</td><td>");_.b(_.v(_.f("Percent",c,p,0)));_.b("</td></tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    Percentages shown represent the proportion of habitats available in ");_.b("\n" + i);_.b("    Barbuda's entire 3 nautical mile boundary captured within this zone.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Marxan Analysis <a style=\"top:0px;\" class=\"marxan-node\" href=\"#\" data-toggle-node=\"533de20aa498867c56c6cba5\">Show 'Scenario 1' Marxan Layer</a>&nbsp</h4>");_.b("\n" + i);_.b("  <select class=\"chosen\" width=\"380px\">");_.b("\n" + i);if(_.s(_.f("marxanAnalyses",c,p,1),c,p,0,831,886,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <option value=\"");_.b(_.v(_.d(".",c,p,0)));_.b("\">Scenario ");_.b(_.v(_.d(".",c,p,0)));_.b("</option>");_.b("\n");});c.pop();}_.b("  </select>");_.b("\n" + i);_.b("  <p class=\"scenarioResults\"></p>");_.b("\n" + i);_.b("  <div class=\"viz\"></div>");_.b("\n" + i);_.b("  <p class=\"scenarioDescription\"></p>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});
this["Templates"]["overview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<div class=\"reportSection size\">");_.b("\n" + i);_.b("  <h4>Size</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This area is <strong>");_.b(_.v(_.f("SQ_MILES",c,p,0)));_.b(" square miles</strong>,");_.b("\n" + i);_.b("    which represents <strong>");_.b(_.v(_.f("PERCENT",c,p,0)));_.b("%</strong> of Barbuda's waters.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);if(_.s(_.f("renderMinimumWidth",c,p,1),c,p,0,536,1178,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection diameter ");if(!_.s(_.f("DIAM_OK",c,p,1),c,p,1,0,0,"")){_.b("warning");};_.b("\">");_.b("\n" + i);_.b("  <h4>Minimum Width</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    The minimum width of a zone significantly impacts  its conservation value. ");_.b("\n" + i);_.b("    The recommended smallest diameter is between 2 and 3 miles.");_.b("\n" + i);_.b("    <strong>");_.b("\n" + i);if(!_.s(_.f("DIAM_OK",c,p,1),c,p,1,0,0,"")){_.b("    This design falls outside the recommendation at ");_.b(_.v(_.f("DIAM",c,p,0)));_.b(" miles.");_.b("\n");};if(_.s(_.f("DIAM_OK",c,p,1),c,p,0,926,997,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    This design fits within the recommendation at ");_.b(_.v(_.f("DIAM",c,p,0)));_.b(" miles.");_.b("\n");});c.pop();}_.b("    </strong>");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <div class=\"viz\" style=\"position:relative;\"></div>");_.b("\n" + i);_.b("  <img src=\"http://s3.amazonaws.com/SeaSketch/projects/barbuda/min_width_example.png\">");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);if(_.s(_.f("anyAttributes",c,p,1),c,p,0,1221,1345,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" Attributes</h4>");_.b("\n" + i);_.b(_.rp("attributes/attributesTable",c,p,"  "));_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}return _.fl();;});

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = this["Templates"];
}
},{}]},{},[11])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL3RyYWluaW5nLXJlcG9ydHMtdjIvbm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvdHJhaW5pbmctcmVwb3J0cy12Mi9ub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9saWIvX2VtcHR5LmpzIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL2VuYWJsZUxheWVyVG9nZ2xlcnMuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL2pvYkl0ZW0uY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL3JlcG9ydFJlc3VsdHMuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL3JlcG9ydFRhYi5jb2ZmZWUiLCIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL3RyYWluaW5nLXJlcG9ydHMtdjIvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvdXRpbHMuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL3NjcmlwdHMvZmlzaFNhbmN0dWFyeS5jb2ZmZWUiLCIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL3RyYWluaW5nLXJlcG9ydHMtdjIvc2NyaXB0cy9maXNoaW5nVmFsdWUuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL3NjcmlwdHMvaGFiaXRhdFRhYi5jb2ZmZWUiLCIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL3RyYWluaW5nLXJlcG9ydHMtdjIvc2NyaXB0cy9pZHMuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL3NjcmlwdHMvb3ZlcnZpZXdUYWIuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTs7QUNBQSxDQUFPLENBQVUsQ0FBQSxHQUFYLENBQU4sRUFBa0I7Q0FDaEIsS0FBQSwyRUFBQTtDQUFBLENBQUEsQ0FBQTtDQUFBLENBQ0EsQ0FBQSxHQUFZO0NBRFosQ0FFQSxDQUFBLEdBQU07QUFDQyxDQUFQLENBQUEsQ0FBQSxDQUFBO0NBQ0UsRUFBQSxDQUFBLEdBQU8scUJBQVA7Q0FDQSxTQUFBO0lBTEY7Q0FBQSxDQU1BLENBQVcsQ0FBQSxJQUFYLGFBQVc7Q0FFWDtDQUFBLE1BQUEsb0NBQUE7d0JBQUE7Q0FDRSxFQUFXLENBQVgsR0FBVyxDQUFYO0NBQUEsRUFDUyxDQUFULEVB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QU5WLEVBQUEsQ0FJaUIsRUFFTjtDQUFNLEVBQUssQ0FBRixDQUFBLEdBQUg7Q0FBa0MsZ0JBQUQ7TUFBakMsSUFBQTtDQUFBLGdCQUE2QztVQUFwRDtDQU5WLEVBUVksQ0FSWixFQUFBLENBTVUsRUFFRztDQUNMLEdBQUcsQ0FBVyxFQUFWLENBQUo7Q0FDTyxFQUFELENBQUgsQ0FBQSxZQUFBO01BREgsSUFBQTtDQUdLLENBQUgsQ0FBRSxFQUFGLFlBQUE7VUFKRTtDQVJaLE1BUVk7Q0FNTixDQUdXLENBQ0EsQ0FKakIsQ0FBSyxDQUFMLENBQUEsRUFBQSxDQUFBLEdBQUE7Q0FJd0IsRUFBTyxZQUFQO0NBSnhCLEVBS1EsQ0FMUixHQUlpQixFQUNSO0NBQUQsY0FBTztDQUxmLE1BS1E7TUFuREg7Q0ExQ1QsRUEwQ1M7O0NBMUNUOztDQUR3Qjs7QUFpRzFCLENBbkhBLEVBbUhpQixHQUFYLENBQU4sSUFuSEE7Ozs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsbnVsbCwibW9kdWxlLmV4cG9ydHMgPSAoZWwpIC0+XG4gICRlbCA9ICQgZWxcbiAgYXBwID0gd2luZG93LmFwcFxuICB0b2MgPSBhcHAuZ2V0VG9jKClcbiAgdW5sZXNzIHRvY1xuICAgIGNvbnNvbGUubG9nICdObyB0YWJsZSBvZiBjb250ZW50cyBmb3VuZCdcbiAgICByZXR1cm5cbiAgdG9nZ2xlcnMgPSAkZWwuZmluZCgnYVtkYXRhLXRvZ2dsZS1ub2RlXScpXG4gICMgU2V0IGluaXRpYWwgc3RhdGVcbiAgZm9yIHRvZ2dsZXIgaW4gdG9nZ2xlcnMudG9BcnJheSgpXG4gICAgJHRvZ2dsZXIgPSAkKHRvZ2dsZXIpXG4gICAgbm9kZWlkID0gJHRvZ2dsZXIuZGF0YSgndG9nZ2xlLW5vZGUnKVxuICAgIHRyeVxuICAgICAgdmlldyA9IHRvYy5nZXRDaGlsZFZpZXdCeUlkIG5vZGVpZFxuICAgICAgbm9kZSA9IHZpZXcubW9kZWxcbiAgICAgICR0b2dnbGVyLmF0dHIgJ2RhdGEtdmlzaWJsZScsICEhbm9kZS5nZXQoJ3Zpc2libGUnKVxuICAgICAgJHRvZ2dsZXIuZGF0YSAndG9jSXRlbScsIHZpZXdcbiAgICBjYXRjaCBlXG4gICAgICAkdG9nZ2xlci5hdHRyICdkYXRhLW5vdC1mb3VuZCcsICd0cnVlJ1xuXG4gIHRvZ2dsZXJzLm9uICdjbGljaycsIChlKSAtPlxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICRlbCA9ICQoZS50YXJnZXQpXG4gICAgdmlldyA9ICRlbC5kYXRhKCd0b2NJdGVtJylcbiAgICBpZiB2aWV3XG4gICAgICB2aWV3LnRvZ2dsZVZpc2liaWxpdHkoZSlcbiAgICAgICRlbC5hdHRyICdkYXRhLXZpc2libGUnLCAhIXZpZXcubW9kZWwuZ2V0KCd2aXNpYmxlJylcbiAgICBlbHNlXG4gICAgICBhbGVydCBcIkxheWVyIG5vdCBmb3VuZCBpbiB0aGUgY3VycmVudCBUYWJsZSBvZiBDb250ZW50cy4gXFxuRXhwZWN0ZWQgbm9kZWlkICN7JGVsLmRhdGEoJ3RvZ2dsZS1ub2RlJyl9XCJcbiIsImNsYXNzIEpvYkl0ZW0gZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gIGNsYXNzTmFtZTogJ3JlcG9ydFJlc3VsdCdcbiAgZXZlbnRzOiB7fVxuICBiaW5kaW5nczpcbiAgICBcImg2IGFcIjpcbiAgICAgIG9ic2VydmU6IFwic2VydmljZU5hbWVcIlxuICAgICAgdXBkYXRlVmlldzogdHJ1ZVxuICAgICAgYXR0cmlidXRlczogW3tcbiAgICAgICAgbmFtZTogJ2hyZWYnXG4gICAgICAgIG9ic2VydmU6ICdzZXJ2aWNlVXJsJ1xuICAgICAgfV1cbiAgICBcIi5zdGFydGVkQXRcIjpcbiAgICAgIG9ic2VydmU6IFtcInN0YXJ0ZWRBdFwiLCBcInN0YXR1c1wiXVxuICAgICAgdmlzaWJsZTogKCkgLT5cbiAgICAgICAgQG1vZGVsLmdldCgnc3RhdHVzJykgbm90IGluIFsnY29tcGxldGUnLCAnZXJyb3InXVxuICAgICAgdXBkYXRlVmlldzogdHJ1ZVxuICAgICAgb25HZXQ6ICgpIC0+XG4gICAgICAgIGlmIEBtb2RlbC5nZXQoJ3N0YXJ0ZWRBdCcpXG4gICAgICAgICAgcmV0dXJuIFwiU3RhcnRlZCBcIiArIG1vbWVudChAbW9kZWwuZ2V0KCdzdGFydGVkQXQnKSkuZnJvbU5vdygpICsgXCIuIFwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBcIlwiXG4gICAgXCIuc3RhdHVzXCI6ICAgICAgXG4gICAgICBvYnNlcnZlOiBcInN0YXR1c1wiXG4gICAgICBvbkdldDogKHMpIC0+XG4gICAgICAgIHN3aXRjaCBzXG4gICAgICAgICAgd2hlbiAncGVuZGluZydcbiAgICAgICAgICAgIFwid2FpdGluZyBpbiBsaW5lXCJcbiAgICAgICAgICB3aGVuICdydW5uaW5nJ1xuICAgICAgICAgICAgXCJydW5uaW5nIGFuYWx5dGljYWwgc2VydmljZVwiXG4gICAgICAgICAgd2hlbiAnY29tcGxldGUnXG4gICAgICAgICAgICBcImNvbXBsZXRlZFwiXG4gICAgICAgICAgd2hlbiAnZXJyb3InXG4gICAgICAgICAgICBcImFuIGVycm9yIG9jY3VycmVkXCJcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBzXG4gICAgXCIucXVldWVMZW5ndGhcIjogXG4gICAgICBvYnNlcnZlOiBcInF1ZXVlTGVuZ3RoXCJcbiAgICAgIG9uR2V0OiAodikgLT5cbiAgICAgICAgcyA9IFwiV2FpdGluZyBiZWhpbmQgI3t2fSBqb2JcIlxuICAgICAgICBpZiB2Lmxlbmd0aCA+IDFcbiAgICAgICAgICBzICs9ICdzJ1xuICAgICAgICByZXR1cm4gcyArIFwiLiBcIlxuICAgICAgdmlzaWJsZTogKHYpIC0+XG4gICAgICAgIHY/IGFuZCBwYXJzZUludCh2KSA+IDBcbiAgICBcIi5lcnJvcnNcIjpcbiAgICAgIG9ic2VydmU6ICdlcnJvcidcbiAgICAgIHVwZGF0ZVZpZXc6IHRydWVcbiAgICAgIHZpc2libGU6ICh2KSAtPlxuICAgICAgICB2Py5sZW5ndGggPiAyXG4gICAgICBvbkdldDogKHYpIC0+XG4gICAgICAgIGlmIHY/XG4gICAgICAgICAgSlNPTi5zdHJpbmdpZnkodiwgbnVsbCwgJyAgJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgIG51bGxcblxuICBjb25zdHJ1Y3RvcjogKEBtb2RlbCkgLT5cbiAgICBzdXBlcigpXG5cbiAgcmVuZGVyOiAoKSAtPlxuICAgIEAkZWwuaHRtbCBcIlwiXCJcbiAgICAgIDxoNj48YSBocmVmPVwiI1wiIHRhcmdldD1cIl9ibGFua1wiPjwvYT48c3BhbiBjbGFzcz1cInN0YXR1c1wiPjwvc3Bhbj48L2g2PlxuICAgICAgPGRpdj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJzdGFydGVkQXRcIj48L3NwYW4+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwicXVldWVMZW5ndGhcIj48L3NwYW4+XG4gICAgICAgIDxwcmUgY2xhc3M9XCJlcnJvcnNcIj48L3ByZT5cbiAgICAgIDwvZGl2PlxuICAgIFwiXCJcIlxuICAgIEBzdGlja2l0KClcblxubW9kdWxlLmV4cG9ydHMgPSBKb2JJdGVtIiwiY2xhc3MgUmVwb3J0UmVzdWx0cyBleHRlbmRzIEJhY2tib25lLkNvbGxlY3Rpb25cblxuICBkZWZhdWx0UG9sbGluZ0ludGVydmFsOiAzMDAwXG5cbiAgY29uc3RydWN0b3I6IChAc2tldGNoLCBAZGVwcykgLT5cbiAgICBAdXJsID0gdXJsID0gXCIvcmVwb3J0cy8je0Bza2V0Y2guaWR9LyN7QGRlcHMuam9pbignLCcpfVwiXG4gICAgc3VwZXIoKVxuXG4gIHBvbGw6ICgpID0+XG4gICAgQGZldGNoIHtcbiAgICAgIHN1Y2Nlc3M6ICgpID0+XG4gICAgICAgIEB0cmlnZ2VyICdqb2JzJ1xuICAgICAgICBmb3IgcmVzdWx0IGluIEBtb2RlbHNcbiAgICAgICAgICBpZiByZXN1bHQuZ2V0KCdzdGF0dXMnKSBub3QgaW4gWydjb21wbGV0ZScsICdlcnJvciddXG4gICAgICAgICAgICB1bmxlc3MgQGludGVydmFsXG4gICAgICAgICAgICAgIEBpbnRlcnZhbCA9IHNldEludGVydmFsIEBwb2xsLCBAZGVmYXVsdFBvbGxpbmdJbnRlcnZhbFxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgY29uc29sZS5sb2cgQG1vZGVsc1swXS5nZXQoJ3BheWxvYWRTaXplQnl0ZXMnKVxuICAgICAgICAgIHBheWxvYWRTaXplID0gTWF0aC5yb3VuZCgoKEBtb2RlbHNbMF0uZ2V0KCdwYXlsb2FkU2l6ZUJ5dGVzJykgb3IgMCkgLyAxMDI0KSAqIDEwMCkgLyAxMDBcbiAgICAgICAgICBjb25zb2xlLmxvZyBcIkZlYXR1cmVTZXQgc2VudCB0byBHUCB3ZWlnaGVkIGluIGF0ICN7cGF5bG9hZFNpemV9a2JcIlxuICAgICAgICAjIGFsbCBjb21wbGV0ZSB0aGVuXG4gICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKEBpbnRlcnZhbCkgaWYgQGludGVydmFsXG4gICAgICAgIGlmIHByb2JsZW0gPSBfLmZpbmQoQG1vZGVscywgKHIpIC0+IHIuZ2V0KCdlcnJvcicpPylcbiAgICAgICAgICBAdHJpZ2dlciAnZXJyb3InLCBcIlByb2JsZW0gd2l0aCAje3Byb2JsZW0uZ2V0KCdzZXJ2aWNlTmFtZScpfSBqb2JcIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgQHRyaWdnZXIgJ2ZpbmlzaGVkJ1xuICAgICAgZXJyb3I6IChlLCByZXMsIGEsIGIpID0+XG4gICAgICAgIHVubGVzcyByZXMuc3RhdHVzIGlzIDBcbiAgICAgICAgICBpZiByZXMucmVzcG9uc2VUZXh0Py5sZW5ndGhcbiAgICAgICAgICAgIHRyeVxuICAgICAgICAgICAgICBqc29uID0gSlNPTi5wYXJzZShyZXMucmVzcG9uc2VUZXh0KVxuICAgICAgICAgICAgY2F0Y2hcbiAgICAgICAgICAgICAgIyBkbyBub3RoaW5nXG4gICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoQGludGVydmFsKSBpZiBAaW50ZXJ2YWxcbiAgICAgICAgICBAdHJpZ2dlciAnZXJyb3InLCBqc29uPy5lcnJvcj8ubWVzc2FnZSBvclxuICAgICAgICAgICAgJ1Byb2JsZW0gY29udGFjdGluZyB0aGUgU2VhU2tldGNoIHNlcnZlcidcbiAgICB9XG5cbm1vZHVsZS5leHBvcnRzID0gUmVwb3J0UmVzdWx0c1xuIiwiZW5hYmxlTGF5ZXJUb2dnbGVycyA9IHJlcXVpcmUgJy4vZW5hYmxlTGF5ZXJUb2dnbGVycy5jb2ZmZWUnXG5yb3VuZCA9IHJlcXVpcmUoJy4vdXRpbHMuY29mZmVlJykucm91bmRcblJlcG9ydFJlc3VsdHMgPSByZXF1aXJlICcuL3JlcG9ydFJlc3VsdHMuY29mZmVlJ1xudCA9IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnKVxudGVtcGxhdGVzID1cbiAgcmVwb3J0TG9hZGluZzogdFsnbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3JlcG9ydExvYWRpbmcnXVxuSm9iSXRlbSA9IHJlcXVpcmUgJy4vam9iSXRlbS5jb2ZmZWUnXG5Db2xsZWN0aW9uVmlldyA9IHJlcXVpcmUoJ3ZpZXdzL2NvbGxlY3Rpb25WaWV3JylcblxuY2xhc3MgUmVjb3JkU2V0XG5cbiAgY29uc3RydWN0b3I6IChAZGF0YSwgQHRhYiwgQHNrZXRjaENsYXNzSWQpIC0+XG5cbiAgdG9BcnJheTogKCkgLT5cbiAgICBpZiBAc2tldGNoQ2xhc3NJZFxuICAgICAgZGF0YSA9IF8uZmluZCBAZGF0YS52YWx1ZSwgKHYpID0+XG4gICAgICAgIHYuZmVhdHVyZXM/WzBdPy5hdHRyaWJ1dGVzP1snU0NfSUQnXSBpcyBAc2tldGNoQ2xhc3NJZFxuICAgICAgdW5sZXNzIGRhdGFcbiAgICAgICAgdGhyb3cgXCJDb3VsZCBub3QgZmluZCBkYXRhIGZvciBza2V0Y2hDbGFzcyAje0Bza2V0Y2hDbGFzc0lkfVwiXG4gICAgZWxzZVxuICAgICAgaWYgXy5pc0FycmF5IEBkYXRhLnZhbHVlXG4gICAgICAgIGRhdGEgPSBAZGF0YS52YWx1ZVswXVxuICAgICAgZWxzZVxuICAgICAgICBkYXRhID0gQGRhdGEudmFsdWVcbiAgICBfLm1hcCBkYXRhLmZlYXR1cmVzLCAoZmVhdHVyZSkgLT5cbiAgICAgIGZlYXR1cmUuYXR0cmlidXRlc1xuXG4gIHJhdzogKGF0dHIpIC0+XG4gICAgYXR0cnMgPSBfLm1hcCBAdG9BcnJheSgpLCAocm93KSAtPlxuICAgICAgcm93W2F0dHJdXG4gICAgYXR0cnMgPSBfLmZpbHRlciBhdHRycywgKGF0dHIpIC0+IGF0dHIgIT0gdW5kZWZpbmVkXG4gICAgaWYgYXR0cnMubGVuZ3RoIGlzIDBcbiAgICAgIGNvbnNvbGUubG9nIEBkYXRhXG4gICAgICBAdGFiLnJlcG9ydEVycm9yIFwiQ291bGQgbm90IGdldCBhdHRyaWJ1dGUgI3thdHRyfSBmcm9tIHJlc3VsdHNcIlxuICAgICAgdGhyb3cgXCJDb3VsZCBub3QgZ2V0IGF0dHJpYnV0ZSAje2F0dHJ9XCJcbiAgICBlbHNlIGlmIGF0dHJzLmxlbmd0aCBpcyAxXG4gICAgICByZXR1cm4gYXR0cnNbMF1cbiAgICBlbHNlXG4gICAgICByZXR1cm4gYXR0cnNcblxuICBpbnQ6IChhdHRyKSAtPlxuICAgIHJhdyA9IEByYXcoYXR0cilcbiAgICBpZiBfLmlzQXJyYXkocmF3KVxuICAgICAgXy5tYXAgcmF3LCBwYXJzZUludFxuICAgIGVsc2VcbiAgICAgIHBhcnNlSW50KHJhdylcblxuICBmbG9hdDogKGF0dHIsIGRlY2ltYWxQbGFjZXM9MikgLT5cbiAgICByYXcgPSBAcmF3KGF0dHIpXG4gICAgaWYgXy5pc0FycmF5KHJhdylcbiAgICAgIF8ubWFwIHJhdywgKHZhbCkgLT4gcm91bmQodmFsLCBkZWNpbWFsUGxhY2VzKVxuICAgIGVsc2VcbiAgICAgIHJvdW5kKHJhdywgZGVjaW1hbFBsYWNlcylcblxuICBib29sOiAoYXR0cikgLT5cbiAgICByYXcgPSBAcmF3KGF0dHIpXG4gICAgaWYgXy5pc0FycmF5KHJhdylcbiAgICAgIF8ubWFwIHJhdywgKHZhbCkgLT4gdmFsLnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKSBpcyAndHJ1ZSdcbiAgICBlbHNlXG4gICAgICByYXcudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpIGlzICd0cnVlJ1xuXG5jbGFzcyBSZXBvcnRUYWIgZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gIG5hbWU6ICdJbmZvcm1hdGlvbidcbiAgZGVwZW5kZW5jaWVzOiBbXVxuXG4gIGluaXRpYWxpemU6IChAbW9kZWwsIEBvcHRpb25zKSAtPlxuICAgICMgV2lsbCBiZSBpbml0aWFsaXplZCBieSBTZWFTa2V0Y2ggd2l0aCB0aGUgZm9sbG93aW5nIGFyZ3VtZW50czpcbiAgICAjICAgKiBtb2RlbCAtIFRoZSBza2V0Y2ggYmVpbmcgcmVwb3J0ZWQgb25cbiAgICAjICAgKiBvcHRpb25zXG4gICAgIyAgICAgLSAucGFyZW50IC0gdGhlIHBhcmVudCByZXBvcnQgdmlld1xuICAgICMgICAgICAgIGNhbGwgQG9wdGlvbnMucGFyZW50LmRlc3Ryb3koKSB0byBjbG9zZSB0aGUgd2hvbGUgcmVwb3J0IHdpbmRvd1xuICAgIEBhcHAgPSB3aW5kb3cuYXBwXG4gICAgXy5leHRlbmQgQCwgQG9wdGlvbnNcbiAgICBAcmVwb3J0UmVzdWx0cyA9IG5ldyBSZXBvcnRSZXN1bHRzKEBtb2RlbCwgQGRlcGVuZGVuY2llcylcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAnZXJyb3InLCBAcmVwb3J0RXJyb3JcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAnam9icycsIEByZW5kZXJKb2JEZXRhaWxzXG4gICAgQGxpc3RlblRvT25jZSBAcmVwb3J0UmVzdWx0cywgJ2pvYnMnLCBAcmVwb3J0Sm9ic1xuICAgIEBsaXN0ZW5UbyBAcmVwb3J0UmVzdWx0cywgJ2ZpbmlzaGVkJywgXy5iaW5kIEByZW5kZXIsIEBcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAncmVxdWVzdCcsIEByZXBvcnRSZXF1ZXN0ZWRcblxuICByZW5kZXI6ICgpIC0+XG4gICAgdGhyb3cgJ3JlbmRlciBtZXRob2QgbXVzdCBiZSBvdmVyaWRkZW4nXG5cbiAgc2hvdzogKCkgLT5cbiAgICBAJGVsLnNob3coKVxuICAgIEB2aXNpYmxlID0gdHJ1ZVxuICAgIGlmIEBkZXBlbmRlbmNpZXM/Lmxlbmd0aCBhbmQgIUByZXBvcnRSZXN1bHRzLm1vZGVscy5sZW5ndGhcbiAgICAgIEByZXBvcnRSZXN1bHRzLnBvbGwoKVxuICAgIGVsc2UgaWYgIUBkZXBlbmRlbmNpZXM/Lmxlbmd0aFxuICAgICAgQHJlbmRlcigpXG4gICAgICBAJCgnW2RhdGEtYXR0cmlidXRlLXR5cGU9VXJsRmllbGRdIC52YWx1ZSwgW2RhdGEtYXR0cmlidXRlLXR5cGU9VXBsb2FkRmllbGRdIC52YWx1ZScpLmVhY2ggKCkgLT5cbiAgICAgICAgdGV4dCA9ICQoQCkudGV4dCgpXG4gICAgICAgIGh0bWwgPSBbXVxuICAgICAgICBmb3IgdXJsIGluIHRleHQuc3BsaXQoJywnKVxuICAgICAgICAgIGlmIHVybC5sZW5ndGhcbiAgICAgICAgICAgIG5hbWUgPSBfLmxhc3QodXJsLnNwbGl0KCcvJykpXG4gICAgICAgICAgICBodG1sLnB1c2ggXCJcIlwiPGEgdGFyZ2V0PVwiX2JsYW5rXCIgaHJlZj1cIiN7dXJsfVwiPiN7bmFtZX08L2E+XCJcIlwiXG4gICAgICAgICQoQCkuaHRtbCBodG1sLmpvaW4oJywgJylcblxuXG4gIGhpZGU6ICgpIC0+XG4gICAgQCRlbC5oaWRlKClcbiAgICBAdmlzaWJsZSA9IGZhbHNlXG5cbiAgcmVtb3ZlOiAoKSA9PlxuICAgIHdpbmRvdy5jbGVhckludGVydmFsIEBldGFJbnRlcnZhbFxuICAgIEBzdG9wTGlzdGVuaW5nKClcbiAgICBzdXBlcigpXG5cbiAgcmVwb3J0UmVxdWVzdGVkOiAoKSA9PlxuICAgIEAkZWwuaHRtbCB0ZW1wbGF0ZXMucmVwb3J0TG9hZGluZy5yZW5kZXIoe30pXG5cbiAgcmVwb3J0RXJyb3I6IChtc2csIGNhbmNlbGxlZFJlcXVlc3QpID0+XG4gICAgdW5sZXNzIGNhbmNlbGxlZFJlcXVlc3RcbiAgICAgIGlmIG1zZyBpcyAnSk9CX0VSUk9SJ1xuICAgICAgICBAc2hvd0Vycm9yICdFcnJvciB3aXRoIHNwZWNpZmljIGpvYidcbiAgICAgIGVsc2VcbiAgICAgICAgQHNob3dFcnJvciBtc2dcblxuICBzaG93RXJyb3I6IChtc2cpID0+XG4gICAgQCQoJy5wcm9ncmVzcycpLnJlbW92ZSgpXG4gICAgQCQoJ3AuZXJyb3InKS5yZW1vdmUoKVxuICAgIEAkKCdoNCcpLnRleHQoXCJBbiBFcnJvciBPY2N1cnJlZFwiKS5hZnRlciBcIlwiXCJcbiAgICAgIDxwIGNsYXNzPVwiZXJyb3JcIiBzdHlsZT1cInRleHQtYWxpZ246Y2VudGVyO1wiPiN7bXNnfTwvcD5cbiAgICBcIlwiXCJcblxuICByZXBvcnRKb2JzOiAoKSA9PlxuICAgIHVubGVzcyBAbWF4RXRhXG4gICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS53aWR0aCgnMTAwJScpXG4gICAgQCQoJ2g0JykudGV4dCBcIkFuYWx5emluZyBEZXNpZ25zXCJcblxuICBzdGFydEV0YUNvdW50ZG93bjogKCkgPT5cbiAgICBpZiBAbWF4RXRhXG4gICAgICBfLmRlbGF5ICgpID0+XG4gICAgICAgIEByZXBvcnRSZXN1bHRzLnBvbGwoKVxuICAgICAgLCAoQG1heEV0YSArIDEpICogMTAwMFxuICAgICAgXy5kZWxheSAoKSA9PlxuICAgICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS5jc3MgJ3RyYW5zaXRpb24tdGltaW5nLWZ1bmN0aW9uJywgJ2xpbmVhcidcbiAgICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykuY3NzICd0cmFuc2l0aW9uLWR1cmF0aW9uJywgXCIje0BtYXhFdGEgKyAxfXNcIlxuICAgICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS53aWR0aCgnMTAwJScpXG4gICAgICAsIDUwMFxuXG4gIHJlbmRlckpvYkRldGFpbHM6ICgpID0+XG4gICAgbWF4RXRhID0gbnVsbFxuICAgIGZvciBqb2IgaW4gQHJlcG9ydFJlc3VsdHMubW9kZWxzXG4gICAgICBpZiBqb2IuZ2V0KCdldGFTZWNvbmRzJylcbiAgICAgICAgaWYgIW1heEV0YSBvciBqb2IuZ2V0KCdldGFTZWNvbmRzJykgPiBtYXhFdGFcbiAgICAgICAgICBtYXhFdGEgPSBqb2IuZ2V0KCdldGFTZWNvbmRzJylcbiAgICBpZiBtYXhFdGFcbiAgICAgIEBtYXhFdGEgPSBtYXhFdGFcbiAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLndpZHRoKCc1JScpXG4gICAgICBAc3RhcnRFdGFDb3VudGRvd24oKVxuXG4gICAgQCQoJ1tyZWw9ZGV0YWlsc10nKS5jc3MoJ2Rpc3BsYXknLCAnYmxvY2snKVxuICAgIEAkKCdbcmVsPWRldGFpbHNdJykuY2xpY2sgKGUpID0+XG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgIEAkKCdbcmVsPWRldGFpbHNdJykuaGlkZSgpXG4gICAgICBAJCgnLmRldGFpbHMnKS5zaG93KClcbiAgICBmb3Igam9iIGluIEByZXBvcnRSZXN1bHRzLm1vZGVsc1xuICAgICAgaXRlbSA9IG5ldyBKb2JJdGVtKGpvYilcbiAgICAgIGl0ZW0ucmVuZGVyKClcbiAgICAgIEAkKCcuZGV0YWlscycpLmFwcGVuZCBpdGVtLmVsXG5cbiAgZ2V0UmVzdWx0OiAoaWQpIC0+XG4gICAgcmVzdWx0cyA9IEBnZXRSZXN1bHRzKClcbiAgICByZXN1bHQgPSBfLmZpbmQgcmVzdWx0cywgKHIpIC0+IHIucGFyYW1OYW1lIGlzIGlkXG4gICAgdW5sZXNzIHJlc3VsdD9cbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gcmVzdWx0IHdpdGggaWQgJyArIGlkKVxuICAgIHJlc3VsdC52YWx1ZVxuXG4gIGdldEZpcnN0UmVzdWx0OiAocGFyYW0sIGlkKSAtPlxuICAgIHJlc3VsdCA9IEBnZXRSZXN1bHQocGFyYW0pXG4gICAgdHJ5XG4gICAgICByZXR1cm4gcmVzdWx0WzBdLmZlYXR1cmVzWzBdLmF0dHJpYnV0ZXNbaWRdXG4gICAgY2F0Y2ggZVxuICAgICAgdGhyb3cgXCJFcnJvciBmaW5kaW5nICN7cGFyYW19OiN7aWR9IGluIGdwIHJlc3VsdHNcIlxuXG4gIGdldFJlc3VsdHM6ICgpIC0+XG4gICAgcmVzdWx0cyA9IEByZXBvcnRSZXN1bHRzLm1hcCgocmVzdWx0KSAtPiByZXN1bHQuZ2V0KCdyZXN1bHQnKS5yZXN1bHRzKVxuICAgIHVubGVzcyByZXN1bHRzPy5sZW5ndGhcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gZ3AgcmVzdWx0cycpXG4gICAgXy5maWx0ZXIgcmVzdWx0cywgKHJlc3VsdCkgLT5cbiAgICAgIHJlc3VsdC5wYXJhbU5hbWUgbm90IGluIFsnUmVzdWx0Q29kZScsICdSZXN1bHRNc2cnXVxuXG4gIHJlY29yZFNldDogKGRlcGVuZGVuY3ksIHBhcmFtTmFtZSwgc2tldGNoQ2xhc3NJZD1mYWxzZSkgLT5cbiAgICB1bmxlc3MgZGVwZW5kZW5jeSBpbiBAZGVwZW5kZW5jaWVzXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJVbmtub3duIGRlcGVuZGVuY3kgI3tkZXBlbmRlbmN5fVwiXG4gICAgZGVwID0gQHJlcG9ydFJlc3VsdHMuZmluZCAocikgLT4gci5nZXQoJ3NlcnZpY2VOYW1lJykgaXMgZGVwZW5kZW5jeVxuICAgIHVubGVzcyBkZXBcbiAgICAgIGNvbnNvbGUubG9nIEByZXBvcnRSZXN1bHRzLm1vZGVsc1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwiQ291bGQgbm90IGZpbmQgcmVzdWx0cyBmb3IgI3tkZXBlbmRlbmN5fS5cIlxuICAgIHBhcmFtID0gXy5maW5kIGRlcC5nZXQoJ3Jlc3VsdCcpLnJlc3VsdHMsIChwYXJhbSkgLT5cbiAgICAgIHBhcmFtLnBhcmFtTmFtZSBpcyBwYXJhbU5hbWVcbiAgICB1bmxlc3MgcGFyYW1cbiAgICAgIGNvbnNvbGUubG9nIGRlcC5nZXQoJ2RhdGEnKS5yZXN1bHRzXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJDb3VsZCBub3QgZmluZCBwYXJhbSAje3BhcmFtTmFtZX0gaW4gI3tkZXBlbmRlbmN5fVwiXG4gICAgbmV3IFJlY29yZFNldChwYXJhbSwgQCwgc2tldGNoQ2xhc3NJZClcblxuICBlbmFibGVUYWJsZVBhZ2luZzogKCkgLT5cbiAgICBAJCgnW2RhdGEtcGFnaW5nXScpLmVhY2ggKCkgLT5cbiAgICAgICR0YWJsZSA9ICQoQClcbiAgICAgIHBhZ2VTaXplID0gJHRhYmxlLmRhdGEoJ3BhZ2luZycpXG4gICAgICByb3dzID0gJHRhYmxlLmZpbmQoJ3Rib2R5IHRyJykubGVuZ3RoXG4gICAgICBwYWdlcyA9IE1hdGguY2VpbChyb3dzIC8gcGFnZVNpemUpXG4gICAgICBpZiBwYWdlcyA+IDFcbiAgICAgICAgJHRhYmxlLmFwcGVuZCBcIlwiXCJcbiAgICAgICAgICA8dGZvb3Q+XG4gICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgIDx0ZCBjb2xzcGFuPVwiI3skdGFibGUuZmluZCgndGhlYWQgdGgnKS5sZW5ndGh9XCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBhZ2luYXRpb25cIj5cbiAgICAgICAgICAgICAgICAgIDx1bD5cbiAgICAgICAgICAgICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCI+UHJldjwvYT48L2xpPlxuICAgICAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgPC90Zm9vdD5cbiAgICAgICAgXCJcIlwiXG4gICAgICAgIHVsID0gJHRhYmxlLmZpbmQoJ3Rmb290IHVsJylcbiAgICAgICAgZm9yIGkgaW4gXy5yYW5nZSgxLCBwYWdlcyArIDEpXG4gICAgICAgICAgdWwuYXBwZW5kIFwiXCJcIlxuICAgICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCI+I3tpfTwvYT48L2xpPlxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICB1bC5hcHBlbmQgXCJcIlwiXG4gICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCI+TmV4dDwvYT48L2xpPlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgJHRhYmxlLmZpbmQoJ2xpIGEnKS5jbGljayAoZSkgLT5cbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICAkYSA9ICQodGhpcylcbiAgICAgICAgICB0ZXh0ID0gJGEudGV4dCgpXG4gICAgICAgICAgaWYgdGV4dCBpcyAnTmV4dCdcbiAgICAgICAgICAgIGEgPSAkYS5wYXJlbnQoKS5wYXJlbnQoKS5maW5kKCcuYWN0aXZlJykubmV4dCgpLmZpbmQoJ2EnKVxuICAgICAgICAgICAgdW5sZXNzIGEudGV4dCgpIGlzICdOZXh0J1xuICAgICAgICAgICAgICBhLmNsaWNrKClcbiAgICAgICAgICBlbHNlIGlmIHRleHQgaXMgJ1ByZXYnXG4gICAgICAgICAgICBhID0gJGEucGFyZW50KCkucGFyZW50KCkuZmluZCgnLmFjdGl2ZScpLnByZXYoKS5maW5kKCdhJylcbiAgICAgICAgICAgIHVubGVzcyBhLnRleHQoKSBpcyAnUHJldidcbiAgICAgICAgICAgICAgYS5jbGljaygpXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgJGEucGFyZW50KCkucGFyZW50KCkuZmluZCgnLmFjdGl2ZScpLnJlbW92ZUNsYXNzICdhY3RpdmUnXG4gICAgICAgICAgICAkYS5wYXJlbnQoKS5hZGRDbGFzcyAnYWN0aXZlJ1xuICAgICAgICAgICAgbiA9IHBhcnNlSW50KHRleHQpXG4gICAgICAgICAgICAkdGFibGUuZmluZCgndGJvZHkgdHInKS5oaWRlKClcbiAgICAgICAgICAgIG9mZnNldCA9IHBhZ2VTaXplICogKG4gLSAxKVxuICAgICAgICAgICAgJHRhYmxlLmZpbmQoXCJ0Ym9keSB0clwiKS5zbGljZShvZmZzZXQsIG4qcGFnZVNpemUpLnNob3coKVxuICAgICAgICAkKCR0YWJsZS5maW5kKCdsaSBhJylbMV0pLmNsaWNrKClcblxuICAgICAgaWYgbm9Sb3dzTWVzc2FnZSA9ICR0YWJsZS5kYXRhKCduby1yb3dzJylcbiAgICAgICAgaWYgcm93cyBpcyAwXG4gICAgICAgICAgcGFyZW50ID0gJHRhYmxlLnBhcmVudCgpXG4gICAgICAgICAgJHRhYmxlLnJlbW92ZSgpXG4gICAgICAgICAgcGFyZW50LnJlbW92ZUNsYXNzICd0YWJsZUNvbnRhaW5lcidcbiAgICAgICAgICBwYXJlbnQuYXBwZW5kIFwiPHA+I3tub1Jvd3NNZXNzYWdlfTwvcD5cIlxuXG4gIGVuYWJsZUxheWVyVG9nZ2xlcnM6ICgpIC0+XG4gICAgZW5hYmxlTGF5ZXJUb2dnbGVycyhAJGVsKVxuXG4gIGdldENoaWxkcmVuOiAoc2tldGNoQ2xhc3NJZCkgLT5cbiAgICBfLmZpbHRlciBAY2hpbGRyZW4sIChjaGlsZCkgLT4gY2hpbGQuZ2V0U2tldGNoQ2xhc3MoKS5pZCBpcyBza2V0Y2hDbGFzc0lkXG5cblxubW9kdWxlLmV4cG9ydHMgPSBSZXBvcnRUYWJcbiIsIm1vZHVsZS5leHBvcnRzID1cbiAgXG4gIHJvdW5kOiAobnVtYmVyLCBkZWNpbWFsUGxhY2VzKSAtPlxuICAgIHVubGVzcyBfLmlzTnVtYmVyIG51bWJlclxuICAgICAgbnVtYmVyID0gcGFyc2VGbG9hdChudW1iZXIpXG4gICAgbXVsdGlwbGllciA9IE1hdGgucG93IDEwLCBkZWNpbWFsUGxhY2VzXG4gICAgTWF0aC5yb3VuZChudW1iZXIgKiBtdWx0aXBsaWVyKSAvIG11bHRpcGxpZXIiLCJ0aGlzW1wiVGVtcGxhdGVzXCJdID0gdGhpc1tcIlRlbXBsYXRlc1wiXSB8fCB7fTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9hdHRyaWJ1dGVzL2F0dHJpYnV0ZUl0ZW1cIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPHRyIGRhdGEtYXR0cmlidXRlLWlkPVxcXCJcIik7Xy5iKF8udihfLmYoXCJpZFwiLGMscCwwKSkpO18uYihcIlxcXCIgZGF0YS1hdHRyaWJ1dGUtZXhwb3J0aWQ9XFxcIlwiKTtfLmIoXy52KF8uZihcImV4cG9ydGlkXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiBkYXRhLWF0dHJpYnV0ZS10eXBlPVxcXCJcIik7Xy5iKF8udihfLmYoXCJ0eXBlXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0ZCBjbGFzcz1cXFwibmFtZVxcXCI+XCIpO18uYihfLnYoXy5mKFwibmFtZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGQgY2xhc3M9XFxcInZhbHVlXFxcIj5cIik7Xy5iKF8udihfLmYoXCJmb3JtYXR0ZWRWYWx1ZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC90cj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xuXG50aGlzW1wiVGVtcGxhdGVzXCJdW1wibm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL2F0dHJpYnV0ZXMvYXR0cmlidXRlc1RhYmxlXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjx0YWJsZSBjbGFzcz1cXFwiYXR0cmlidXRlc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImF0dHJpYnV0ZXNcIixjLHAsMSksYyxwLDAsNDQsODEsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihfLnJwKFwiYXR0cmlidXRlcy9hdHRyaWJ1dGVJdGVtXCIsYyxwLFwiICAgIFwiKSk7fSk7Yy5wb3AoKTt9Xy5iKFwiPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xuXG50aGlzW1wiVGVtcGxhdGVzXCJdW1wibm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL2dlbmVyaWNBdHRyaWJ1dGVzXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO2lmKF8ucyhfLmQoXCJza2V0Y2hDbGFzcy5kZWxldGVkXCIsYyxwLDEpLGMscCwwLDI0LDI3MCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwiYWxlcnQgYWxlcnQtd2FyblxcXCIgc3R5bGU9XFxcIm1hcmdpbi1ib3R0b206MTBweDtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgVGhpcyBza2V0Y2ggd2FzIGNyZWF0ZWQgdXNpbmcgdGhlIFxcXCJcIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiB0ZW1wbGF0ZSwgd2hpY2ggaXNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIG5vIGxvbmdlciBhdmFpbGFibGUuIFlvdSB3aWxsIG5vdCBiZSBhYmxlIHRvIGNvcHkgdGhpcyBza2V0Y2ggb3IgbWFrZSBuZXdcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIHNrZXRjaGVzIG9mIHRoaXMgdHlwZS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCIgQXR0cmlidXRlczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKF8ucnAoXCJhdHRyaWJ1dGVzL2F0dHJpYnV0ZXNUYWJsZVwiLGMscCxcIiAgICBcIikpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xuXG50aGlzW1wiVGVtcGxhdGVzXCJdW1wibm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3JlcG9ydExvYWRpbmdcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0TG9hZGluZ1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8IS0tIDxkaXYgY2xhc3M9XFxcInNwaW5uZXJcXFwiPjM8L2Rpdj4gLS0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+UmVxdWVzdGluZyBSZXBvcnQgZnJvbSBTZXJ2ZXI8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGRpdiBjbGFzcz1cXFwicHJvZ3Jlc3MgcHJvZ3Jlc3Mtc3RyaXBlZCBhY3RpdmVcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJiYXJcXFwiIHN0eWxlPVxcXCJ3aWR0aDogMTAwJTtcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8YSBocmVmPVxcXCIjXFxcIiByZWw9XFxcImRldGFpbHNcXFwiPmRldGFpbHM8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcImRldGFpbHNcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHRoaXNbXCJUZW1wbGF0ZXNcIl07IiwiT3ZlcnZpZXdUYWIgPSByZXF1aXJlICcuL292ZXJ2aWV3VGFiLmNvZmZlZSdcbkhhYml0YXRUYWIgPSByZXF1aXJlICcuL2hhYml0YXRUYWIuY29mZmVlJ1xuRmlzaGluZ1ZhbHVlVGFiID0gcmVxdWlyZSAnLi9maXNoaW5nVmFsdWUuY29mZmVlJ1xuXG53aW5kb3cuYXBwLnJlZ2lzdGVyUmVwb3J0IChyZXBvcnQpIC0+XG4gIHJlcG9ydC50YWJzIFtPdmVydmlld1RhYiwgSGFiaXRhdFRhYiwgRmlzaGluZ1ZhbHVlVGFiXVxuICAjIHBhdGggbXVzdCBiZSByZWxhdGl2ZSB0byBkaXN0L1xuICByZXBvcnQuc3R5bGVzaGVldHMgWycuL2Zpc2hTYW5jdHVhcnkuY3NzJ11cblxuICAiLCJSZXBvcnRUYWIgPSByZXF1aXJlICdyZXBvcnRUYWInXG50ZW1wbGF0ZXMgPSByZXF1aXJlICcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuX3BhcnRpYWxzID0gcmVxdWlyZSAnLi4vbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5wYXJ0aWFscyA9IFtdXG5mb3Iga2V5LCB2YWwgb2YgX3BhcnRpYWxzXG4gIHBhcnRpYWxzW2tleS5yZXBsYWNlKCdub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvJywgJycpXSA9IHZhbFxuXG5pZHMgPSByZXF1aXJlICcuL2lkcy5jb2ZmZWUnXG5mb3Iga2V5LCB2YWx1ZSBvZiBpZHNcbiAgd2luZG93W2tleV0gPSB2YWx1ZVxuXG5jbGFzcyBGaXNoaW5nVmFsdWVUYWIgZXh0ZW5kcyBSZXBvcnRUYWJcbiAgbmFtZTogJ0Zpc2hpbmcgVmFsdWUnXG4gIGNsYXNzTmFtZTogJ2Zpc2hpbmdWYWx1ZSdcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5maXNoaW5nVmFsdWVcbiAgZGVwZW5kZW5jaWVzOiBbJ0Zpc2hpbmdWYWx1ZSddXG4gIHRpbWVvdXQ6IDEyMDAwMFxuICBhcmVhTGFiZWw6ICdwcm90ZWN0ZWQgYXJlYSdcblxuICByZW5kZXI6ICgpIC0+XG4gICAgaXNNb29yaW5nQXJlYSA9IChAc2tldGNoQ2xhc3MuaWQgaXMgTU9PUklOR19JRClcbiAgICBpc1NoaXBwaW5nQXJlYSA9IChAc2tldGNoQ2xhc3MuaWQgaXMgU0hJUFBJTkdfWk9ORV9JRClcbiAgICBpc01vb3JpbmdPclNoaXBwaW5nID0gaXNNb29yaW5nQXJlYSBvciBpc1NoaXBwaW5nQXJlYVxuICAgIGFyZWFMYWJlbCA9IEBza2V0Y2hDbGFzcy5hdHRyaWJ1dGVzLm5hbWVcbiAgICBjb250ZXh0ID1cbiAgICAgIHNrZXRjaDogQG1vZGVsLmZvclRlbXBsYXRlKClcbiAgICAgIHNrZXRjaENsYXNzOiBAc2tldGNoQ2xhc3MuZm9yVGVtcGxhdGUoKVxuICAgICAgYXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKVxuICAgICAgYWRtaW46IEBwcm9qZWN0LmlzQWRtaW4gd2luZG93LnVzZXJcbiAgICAgIHBlcmNlbnQ6IEByZWNvcmRTZXQoJ0Zpc2hpbmdWYWx1ZScsICdGaXNoaW5nVmFsdWUnKS5mbG9hdCgnUEVSQ0VOVCcsIDIpXG4gICAgICBhcmVhTGFiZWw6IGFyZWFMYWJlbFxuICAgICAgaXNNb29yaW5nT3JTaGlwcGluZzogaXNNb29yaW5nT3JTaGlwcGluZ1xuICAgIFxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHRlbXBsYXRlcylcbiAgICBAZW5hYmxlTGF5ZXJUb2dnbGVycyhAJGVsKVxuXG5cbm1vZHVsZS5leHBvcnRzID0gRmlzaGluZ1ZhbHVlVGFiIiwiUmVwb3J0VGFiID0gcmVxdWlyZSAncmVwb3J0VGFiJ1xudGVtcGxhdGVzID0gcmVxdWlyZSAnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcblxuY2xhc3MgSGFiaXRhdFRhYiBleHRlbmRzIFJlcG9ydFRhYlxuICBuYW1lOiAnSGFiaXRhdCdcbiAgY2xhc3NOYW1lOiAnaGFiaXRhdCdcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5oYWJpdGF0XG4gIGRlcGVuZGVuY2llczogW1xuICAgICdCYXJidWRhSGFiaXRhdCdcbiAgICAnTWFyeGFuQW5hbHlzaXMnXG4gIF1cbiAgcGFyYW1OYW1lOiAnSGFiaXRhdHMnXG4gIHRpbWVvdXQ6IDEyMDAwMFxuICBoZWFkaW5nOiBcIkhhYml0YXQgUmVwcmVzZW50YXRpb25cIlxuICBcbiAgcmVuZGVyOiAoKSAtPlxuICAgIGRlcE5hbWUgPSBAZGVwZW5kZW5jaWVzWzBdXG4gICAgZGF0YSA9IEByZWNvcmRTZXQoZGVwTmFtZSwgQHBhcmFtTmFtZSkudG9BcnJheSgpXG4gICAgY29udGV4dCA9XG4gICAgICBza2V0Y2g6IEBtb2RlbC5mb3JUZW1wbGF0ZSgpXG4gICAgICBza2V0Y2hDbGFzczogQHNrZXRjaENsYXNzLmZvclRlbXBsYXRlKClcbiAgICAgIGF0dHJpYnV0ZXM6IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKClcbiAgICAgIGFkbWluOiBAcHJvamVjdC5pc0FkbWluIHdpbmRvdy51c2VyXG4gICAgICBoYWJpdGF0czogZGF0YVxuICAgICAgaGVhZGluZzogQGhlYWRpbmdcbiAgICAgIG1hcnhhbkFuYWx5c2VzOiBfLm1hcChAcmVjb3JkU2V0KFwiTWFyeGFuQW5hbHlzaXNcIiwgXCJNYXJ4YW5BbmFseXNpc1wiKVxuICAgICAgICAudG9BcnJheSgpLCAoZikgLT4gZi5OQU1FKVxuICAgIFxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHRlbXBsYXRlcylcbiAgICBAZW5hYmxlTGF5ZXJUb2dnbGVycyhAJGVsKVxuICAgIEAkKCcuY2hvc2VuJykuY2hvc2VuKHtkaXNhYmxlX3NlYXJjaF90aHJlc2hvbGQ6IDEwLCB3aWR0aDonNDAwcHgnfSlcbiAgICBAJCgnLmNob3NlbicpLmNoYW5nZSAoKSA9PlxuICAgICAgXy5kZWZlciBAcmVuZGVyTWFyeGFuQW5hbHlzaXNcbiAgICBAcmVuZGVyTWFyeGFuQW5hbHlzaXMoKVxuXG4gIHJlbmRlck1hcnhhbkFuYWx5c2lzOiAoKSA9PlxuICAgIGlmIHdpbmRvdy5kM1xuICAgICAgbmFtZSA9IEAkKCcuY2hvc2VuJykudmFsKClcblxuICAgICAgdHJ5XG4gICAgICAgICNob29rIHVwIHRoZSBjaGVja2JveGVzIGZvciBtYXJ4YW4gc2NlbmFyaW8gbmFtZXNcbiAgICAgICAgbm9kZU1hcCA9IHtcbiAgICAgICAgICAgIFwiMVwiOlwiNTMzZGUyMGFhNDk4ODY3YzU2YzZjYmE1XCJcbiAgICAgICAgICAgIFwiMlwiOlwiNTMzZGUyMGFhNDk4ODY3YzU2YzZjYmE3XCJcbiAgICAgICAgICAgIFwiM1wiOlwiNTMzZGUyMGFhNDk4ODY3YzU2YzZjYmE5XCJcbiAgICAgICAgICAgIFwiNFwiOlwiNTMzZGUyMGFhNDk4ODY3YzU2YzZjYmFiXCJcbiAgICAgICAgICAgIFwiNVwiOlwiNTMzZGUyMGFhNDk4ODY3YzU2YzZjYmFkXCJcbiAgICAgICAgICAgIFwiNlwiOlwiNTMzZGUyMGFhNDk4ODY3YzU2YzZjYmFmXCJcbiAgICAgICAgICAgIFwiN1wiOlwiNTMzZGUyMGFhNDk4ODY3YzU2YzZjYmIxXCJcbiAgICAgICAgICAgIFwiOFwiOlwiNTMzZGUyMGFhNDk4ODY3YzU2YzZjYmIzXCJcbiAgICAgICAgICB9XG4gICAgICAgIHNjZW5hcmlvTmFtZSA9IG5hbWUuc3Vic3RyaW5nKDAsMSlcbiAgICAgICAgbm9kZUlkID0gbm9kZU1hcFtzY2VuYXJpb05hbWVdXG5cbiAgICAgICAgdG9jID0gd2luZG93LmFwcC5nZXRUb2MoKVxuICAgICAgICB2aWV3ID0gdG9jLmdldENoaWxkVmlld0J5SWQobm9kZUlkKVxuICAgICAgICBub2RlID0gdmlldy5tb2RlbFxuICAgICAgICBpc1Zpc2libGUgPSBub2RlLmdldCgndmlzaWJsZScpXG4gICAgICAgIEAkKCcubWFyeGFuLW5vZGUnKS5hdHRyKCdkYXRhLXRvZ2dsZS1ub2RlJywgbm9kZUlkKVxuICAgICAgICBAJCgnLm1hcnhhbi1ub2RlJykuZGF0YSgndG9jSXRlbScsIHZpZXcpXG4gICAgICAgIEAkKCcubWFyeGFuLW5vZGUnKS5hdHRyKCdjaGVja2VkJywgaXNWaXNpYmxlKVxuICAgICAgICBAJCgnLm1hcnhhbi1ub2RlJykuYXR0cignZGF0YS12aXNpYmxlJywgaXNWaXNpYmxlKVxuICAgICAgICBAJCgnLm1hcnhhbi1ub2RlJykudGV4dCgnc2hvdyBcXCdTY2VuYXJpbyAnK3NjZW5hcmlvTmFtZSsnXFwnIG1hcnhhbiBsYXllcicpXG4gICAgICBjYXRjaCBlXG4gICAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3JcIiwgZSlcblxuICAgICAgcmVjb3JkcyA9IEByZWNvcmRTZXQoXCJNYXJ4YW5BbmFseXNpc1wiLCBcIk1hcnhhbkFuYWx5c2lzXCIpLnRvQXJyYXkoKVxuICAgICAgcXVhbnRpbGVfcmFuZ2UgPSB7XCJRMFwiOlwidmVyeSBsb3dcIiwgXCJRMjBcIjogXCJsb3dcIixcIlE0MFwiOiBcIm1pZFwiLFwiUTYwXCI6IFwiaGlnaFwiLFwiUTgwXCI6IFwidmVyeSBoaWdoXCJ9XG4gICAgICBkYXRhID0gXy5maW5kIHJlY29yZHMsIChyZWNvcmQpIC0+IHJlY29yZC5OQU1FIGlzIG5hbWVcblxuICAgICAgaGlzdG8gPSBkYXRhLkhJU1RPLnNsaWNlKDEsIGRhdGEuSElTVE8ubGVuZ3RoIC0gMSkuc3BsaXQoL1xccy8pXG4gICAgICBoaXN0byA9IF8uZmlsdGVyIGhpc3RvLCAocykgLT4gcy5sZW5ndGggPiAwXG4gICAgICBoaXN0byA9IF8ubWFwIGhpc3RvLCAodmFsKSAtPlxuICAgICAgICBwYXJzZUludCh2YWwpXG4gICAgICBxdWFudGlsZXMgPSBfLmZpbHRlcihfLmtleXMoZGF0YSksIChrZXkpIC0+IGtleS5pbmRleE9mKCdRJykgaXMgMClcbiAgICAgIGZvciBxLCBpIGluIHF1YW50aWxlc1xuICAgICAgICBpZiBwYXJzZUZsb2F0KGRhdGFbcV0pID4gcGFyc2VGbG9hdChkYXRhLlNDT1JFKSBvciBpIGlzIHF1YW50aWxlcy5sZW5ndGggLSAxXG4gICAgICAgICAgbWF4X3EgPSBxdWFudGlsZXNbaV1cbiAgICAgICAgICBtaW5fcSA9IHF1YW50aWxlc1tpIC0gMV0gb3IgXCJRMFwiICMgcXVhbnRpbGVzW2ldXG4gICAgICAgICAgcXVhbnRpbGVfZGVzYyA9IHF1YW50aWxlX3JhbmdlW21pbl9xXVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgXG4gICAgICBAJCgnLnNjZW5hcmlvUmVzdWx0cycpLmh0bWwgXCJcIlwiXG4gICAgICAgIDxhIGhyZWY9XCJodHRwOi8vd3d3LnVxLmVkdS5hdS9tYXJ4YW4vXCIgdGFyZ2V0PVwiX2JsYW5rXCIgPk1hcnhhbjwvYT4gaXMgY29uc2VydmF0aW9uIHBsYW5uaW5nIHNvZnR3YXJlIHRoYXQgcHJvdmlkZXMgZGVjaXNpb24gc3VwcG9ydCBmb3IgYSByYW5nZSBvZiBjb25zZXJ2YXRpb24gcGxhbm5pbmcgcHJvYmxlbXMuIFxuICAgICAgICBJbiB0aGlzIGFuYWx5c2lzLCB0aGUgZ29hbCBpcyB0byBtYXhpbWl6ZSB0aGUgYW1vdW50IG9mIGhhYml0YXQgY29uc2VydmVkLiBUaGUgc2NvcmUgZm9yIGEgMjAwIHNxdWFyZSBtZXRlciBwbGFubmluZyB1bml0IGlzIHRoZSBudW1iZXIgb2YgdGltZXMgaXQgaXMgc2VsZWN0ZWQgaW4gMTAwIHJ1bnMsIFxuICAgICAgICB3aXRoIGhpZ2hlciBzY29yZXMgaW5kaWNhdGluZyBncmVhdGVyIGNvbnNlcnZhdGlvbiB2YWx1ZS4gVGhlIGF2ZXJhZ2UgTWFyeGFuIHNjb3JlIGZvciB0aGlzIHpvbmUgaXMgPHN0cm9uZz4je2RhdGEuU0NPUkV9PC9zdHJvbmc+LCBwbGFjaW5nIGl0IGluIFxuICAgICAgICB0aGUgPHN0cm9uZz4je3F1YW50aWxlX2Rlc2N9PC9zdHJvbmc+IHF1YW50aWxlIHJhbmdlIDxzdHJvbmc+KCN7bWluX3EucmVwbGFjZSgnUScsICcnKX0lIC0gI3ttYXhfcS5yZXBsYWNlKCdRJywgJycpfSUpPC9zdHJvbmc+IFxuICAgICAgICBmb3IgdGhpcyByZWdpb24uIFRoZSBncmFwaCBiZWxvdyBzaG93cyB0aGUgZGlzdHJpYnV0aW9uIG9mIHNjb3JlcyBmb3IgYWxsIHBsYW5uaW5nIHVuaXRzIHdpdGhpbiB0aGlzIHByb2plY3QuXG4gICAgICBcIlwiXCJcblxuICAgICAgQCQoJy5zY2VuYXJpb0Rlc2NyaXB0aW9uJykuaHRtbCBkYXRhLk1BUlhfREVTQ1xuXG4gICAgICBkb21haW4gPSBfLm1hcCBxdWFudGlsZXMsIChxKSAtPiBkYXRhW3FdXG4gICAgICBkb21haW4ucHVzaCAxMDBcbiAgICAgIGRvbWFpbi51bnNoaWZ0IDBcbiAgICAgIGNvbG9yID0gZDMuc2NhbGUubGluZWFyKClcbiAgICAgICAgLmRvbWFpbihkb21haW4pXG4gICAgICAgIC5yYW5nZShbXCIjNDdhZTQzXCIsIFwiIzZjMFwiLCBcIiNlZTBcIiwgXCIjZWI0XCIsIFwiI2VjYmI4OVwiLCBcIiNlZWFiYTBcIl0ucmV2ZXJzZSgpKVxuICAgICAgcXVhbnRpbGVzID0gXy5tYXAgcXVhbnRpbGVzLCAoa2V5KSAtPlxuICAgICAgICBtYXggPSBwYXJzZUZsb2F0KGRhdGFba2V5XSlcbiAgICAgICAgbWluICA9IHBhcnNlRmxvYXQoZGF0YVtxdWFudGlsZXNbXy5pbmRleE9mKHF1YW50aWxlcywga2V5KSAtIDFdXSBvciAwKVxuICAgICAgICB7XG4gICAgICAgICAgcmFuZ2U6IFwiI3twYXJzZUludChrZXkucmVwbGFjZSgnUScsICcnKSkgLSAyMH0tI3trZXkucmVwbGFjZSgnUScsICcnKX0lXCJcbiAgICAgICAgICBuYW1lOiBrZXlcbiAgICAgICAgICBzdGFydDogbWluXG4gICAgICAgICAgZW5kOiBtYXhcbiAgICAgICAgICBiZzogY29sb3IoKG1heCArIG1pbikgLyAyKVxuICAgICAgICB9XG5cbiAgICAgIEAkKCcudml6JykuaHRtbCgnJylcbiAgICAgIGVsID0gQCQoJy52aXonKVswXVxuICAgICAgeCA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgICAgIC5kb21haW4oWzAsIDEwMF0pXG4gICAgICAgIC5yYW5nZShbMCwgNDAwXSkgICAgICBcblxuICAgICAgIyBIaXN0b2dyYW1cbiAgICAgIG1hcmdpbiA9IFxuICAgICAgICB0b3A6IDVcbiAgICAgICAgcmlnaHQ6IDIwXG4gICAgICAgIGJvdHRvbTogMzBcbiAgICAgICAgbGVmdDogNDVcbiAgICAgIHdpZHRoID0gNDAwIC0gbWFyZ2luLmxlZnQgLSBtYXJnaW4ucmlnaHRcbiAgICAgIGhlaWdodCA9IDMwMCAtIG1hcmdpbi50b3AgLSBtYXJnaW4uYm90dG9tXG4gICAgICBcbiAgICAgIHggPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgICAgICAuZG9tYWluKFswLCAxMDBdKVxuICAgICAgICAucmFuZ2UoWzAsIHdpZHRoXSlcbiAgICAgIHkgPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgICAgICAucmFuZ2UoW2hlaWdodCwgMF0pXG4gICAgICAgIC5kb21haW4oWzAsIGQzLm1heChoaXN0byldKVxuXG4gICAgICB4QXhpcyA9IGQzLnN2Zy5heGlzKClcbiAgICAgICAgLnNjYWxlKHgpXG4gICAgICAgIC5vcmllbnQoXCJib3R0b21cIilcbiAgICAgIHlBeGlzID0gZDMuc3ZnLmF4aXMoKVxuICAgICAgICAuc2NhbGUoeSlcbiAgICAgICAgLm9yaWVudChcImxlZnRcIilcblxuICAgICAgc3ZnID0gZDMuc2VsZWN0KEAkKCcudml6JylbMF0pLmFwcGVuZChcInN2Z1wiKVxuICAgICAgICAuYXR0cihcIndpZHRoXCIsIHdpZHRoICsgbWFyZ2luLmxlZnQgKyBtYXJnaW4ucmlnaHQpXG4gICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodCArIG1hcmdpbi50b3AgKyBtYXJnaW4uYm90dG9tKVxuICAgICAgLmFwcGVuZChcImdcIilcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoI3ttYXJnaW4ubGVmdH0sICN7bWFyZ2luLnRvcH0pXCIpXG5cbiAgICAgIHN2Zy5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ4IGF4aXNcIilcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMCwje2hlaWdodH0pXCIpXG4gICAgICAgIC5jYWxsKHhBeGlzKVxuICAgICAgLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIHdpZHRoIC8gMilcbiAgICAgICAgLmF0dHIoXCJkeVwiLCBcIjNlbVwiKVxuICAgICAgICAuc3R5bGUoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxuICAgICAgICAudGV4dChcIlNjb3JlXCIpXG5cbiAgICAgIHN2Zy5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ5IGF4aXNcIilcbiAgICAgICAgLmNhbGwoeUF4aXMpXG4gICAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInJvdGF0ZSgtOTApXCIpXG4gICAgICAgIC5hdHRyKFwieVwiLCA2KVxuICAgICAgICAuYXR0cihcImR5XCIsIFwiLjcxZW1cIilcbiAgICAgICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcbiAgICAgICAgLnRleHQoXCJOdW1iZXIgb2YgUGxhbm5pbmcgVW5pdHNcIilcblxuICAgICAgc3ZnLnNlbGVjdEFsbChcIi5iYXJcIilcbiAgICAgICAgICAuZGF0YShoaXN0bylcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwicmVjdFwiKVxuICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJiYXJcIilcbiAgICAgICAgICAuYXR0cihcInhcIiwgKGQsIGkpIC0+IHgoaSkpXG4gICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCAod2lkdGggLyAxMDApKVxuICAgICAgICAgIC5hdHRyKFwieVwiLCAoZCkgLT4geShkKSlcbiAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCAoZCkgLT4gaGVpZ2h0IC0geShkKSlcbiAgICAgICAgICAuc3R5bGUgJ2ZpbGwnLCAoZCwgaSkgLT5cbiAgICAgICAgICAgIHEgPSBfLmZpbmQgcXVhbnRpbGVzLCAocSkgLT5cbiAgICAgICAgICAgICAgaSA+PSBxLnN0YXJ0IGFuZCBpIDw9IHEuZW5kXG4gICAgICAgICAgICBxPy5iZyBvciBcInN0ZWVsYmx1ZVwiXG5cblxuICAgICAgc3ZnLnNlbGVjdEFsbChcIi5zY29yZVwiKVxuICAgICAgICAgIC5kYXRhKFtNYXRoLnJvdW5kKGRhdGEuU0NPUkUpXSlcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwic2NvcmVcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIChkKSAtPiAoeChkKSAtIDggKSsgJ3B4JylcbiAgICAgICAgLmF0dHIoXCJ5XCIsIChkKSAtPiAoeShoaXN0b1tkXSkgLSAxMCkgKyAncHgnKVxuICAgICAgICAudGV4dChcIuKWvFwiKVxuXG4gICAgICBzdmcuc2VsZWN0QWxsKFwiLnNjb3JlVGV4dFwiKVxuICAgICAgICAgIC5kYXRhKFtNYXRoLnJvdW5kKGRhdGEuU0NPUkUpXSlcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwic2NvcmVUZXh0XCIpXG4gICAgICAgIC5hdHRyKFwieFwiLCAoZCkgLT4gKHgoZCkgLSA2ICkrICdweCcpXG4gICAgICAgIC5hdHRyKFwieVwiLCAoZCkgLT4gKHkoaGlzdG9bZF0pIC0gMzApICsgJ3B4JylcbiAgICAgICAgLnRleHQoKGQpIC0+IGQpXG5cbiAgICAgIEAkKCcudml6JykuYXBwZW5kICc8ZGl2IGNsYXNzPVwibGVnZW5kc1wiPjwvZGl2PidcbiAgICAgIGZvciBxdWFudGlsZSBpbiBxdWFudGlsZXNcbiAgICAgICAgQCQoJy52aXogLmxlZ2VuZHMnKS5hcHBlbmQgXCJcIlwiXG4gICAgICAgICAgPGRpdiBjbGFzcz1cImxlZ2VuZFwiPjxzcGFuIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjoje3F1YW50aWxlLmJnfTtcIj4mbmJzcDs8L3NwYW4+I3txdWFudGlsZS5yYW5nZX08L2Rpdj5cbiAgICAgICAgXCJcIlwiXG4gICAgICBAJCgnLnZpeicpLmFwcGVuZCAnPGJyIHN0eWxlPVwiY2xlYXI6Ym90aDtcIj4nXG5tb2R1bGUuZXhwb3J0cyA9IEhhYml0YXRUYWIiLCJtb2R1bGUuZXhwb3J0cyA9IFxuICBTQU5DVFVBUllfSUQ6ICc1MzNkZTk2YmE0OTg4NjdjNTZjNmQxYzUnXG4gIEFRVUFDVUxUVVJFX0lEOiAnNTIwYmIxYzAwYmQyMmM5YjIxNDdiOTliJ1xuICBNT09SSU5HX0lEOiAnNTMzZGU0ZTNhNDk4ODY3YzU2YzZjZDQ1J1xuICBOT19ORVRfWk9ORVNfSUQ6ICc1MzNkZTYyMGE0OTg4NjdjNTZjNmNmYzInXG4gIFNISVBQSU5HX1pPTkVfSUQ6ICc1MzNkZWNhN2E0OTg4NjdjNTZjNmQ1NWYnXG4iLCJSZXBvcnRUYWIgPSByZXF1aXJlICdyZXBvcnRUYWInXG50ZW1wbGF0ZXMgPSByZXF1aXJlICcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuX3BhcnRpYWxzID0gcmVxdWlyZSAnLi4vbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5wYXJ0aWFscyA9IFtdXG5mb3Iga2V5LCB2YWwgb2YgX3BhcnRpYWxzXG4gIHBhcnRpYWxzW2tleS5yZXBsYWNlKCdub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvJywgJycpXSA9IHZhbFxucm91bmQgPSByZXF1aXJlKCdhcGkvdXRpbHMnKS5yb3VuZFxuaWRzID0gcmVxdWlyZSAnLi9pZHMuY29mZmVlJ1xuZm9yIGtleSwgdmFsdWUgb2YgaWRzXG4gIHdpbmRvd1trZXldID0gdmFsdWVcblxuXG5UT1RBTF9BUkVBID0gMTc1Ljk1ICMgc3EgbWlsZXNcbiMgRGlhbWV0ZXIgZXZhbHVhdGlvbiBhbmQgdmlzdWFsaXphdGlvbiBwYXJhbWV0ZXJzXG5SRUNPTU1FTkRFRF9ESUFNRVRFUiA9IFxuICBtaW46IDJcbiAgbWF4OiAzXG5cbmNsYXNzIE92ZXJ2aWV3VGFiIGV4dGVuZHMgUmVwb3J0VGFiXG4gIG5hbWU6ICdTaXplJ1xuICBjbGFzc05hbWU6ICdvdmVydmlldydcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5vdmVydmlld1xuXG4gIGRlcGVuZGVuY2llczogWydEaWFtZXRlciddXG4gIHRpbWVvdXQ6IDYwMDAwXG4gICMgIHJlbmRlck1pbmltdW1XaWR0aDogdHJ1ZVxuICByZW5kZXI6ICgpIC0+XG5cbiAgICBNSU5fRElBTSA9IEByZWNvcmRTZXQoJ0RpYW1ldGVyJywgJ0RpYW1ldGVyJykuZmxvYXQoJ01JTl9ESUFNJylcbiAgICBTUV9NSUxFUyA9IEByZWNvcmRTZXQoJ0RpYW1ldGVyJywgJ0RpYW1ldGVyJykuZmxvYXQoJ1NRX01JTEVTJylcbiAgICBQRVJDRU5UID0gKFNRX01JTEVTIC8gVE9UQUxfQVJFQSkgKiAxMDAuMFxuICAgIGlmIE1JTl9ESUFNID4gUkVDT01NRU5ERURfRElBTUVURVIubWluXG4gICAgICBESUFNX09LID0gdHJ1ZVxuXG4gICAgc2tpZCA9IEBtb2RlbC5nZXRBdHRyaWJ1dGUoJ1NDX0lEJylcbiAgICBpc05vTmV0Wm9uZSA9IChAc2tldGNoQ2xhc3MuaWQgaXMgTk9fTkVUX1pPTkVTX0lEKVxuICAgIGlzTW9vcmluZ0FyZWEgPSAoQHNrZXRjaENsYXNzLmlkIGlzIE1PT1JJTkdfSUQpXG4gICAgaXNTaGlwcGluZ1pvbmUgPSAoQHNrZXRjaENsYXNzLmlkIGlzIFNISVBQSU5HX1pPTkVfSUQpXG4gICAgcmVuZGVyTWluaW11bVdpZHRoID0gKCFpc05vTmV0Wm9uZSBhbmQgIWlzTW9vcmluZ0FyZWEgYW5kICFpc1NoaXBwaW5nWm9uZSlcbiAgICBjb250ZXh0ID1cbiAgICAgIHNrZXRjaDogQG1vZGVsLmZvclRlbXBsYXRlKClcbiAgICAgIHNrZXRjaENsYXNzOiBAc2tldGNoQ2xhc3MuZm9yVGVtcGxhdGUoKVxuICAgICAgYXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKVxuICAgICAgYW55QXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKS5sZW5ndGggPiAwXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgZGVzY3JpcHRpb246IEBtb2RlbC5nZXRBdHRyaWJ1dGUoJ0RFU0NSSVBUSU9OJylcbiAgICAgIGhhc0Rlc2NyaXB0aW9uOiBAbW9kZWwuZ2V0QXR0cmlidXRlKCdERVNDUklQVElPTicpPy5sZW5ndGggPiAwXG4gICAgICBESUFNX09LOiBESUFNX09LXG4gICAgICBTUV9NSUxFUzogU1FfTUlMRVNcbiAgICAgIERJQU06IE1JTl9ESUFNXG4gICAgICBNSU5fRElBTTogUkVDT01NRU5ERURfRElBTUVURVIubWluXG4gICAgICByZW5kZXJNaW5pbXVtV2lkdGg6IHJlbmRlck1pbmltdW1XaWR0aFxuICAgICAgUEVSQ0VOVDogcm91bmQoUEVSQ0VOVCwgMClcbiAgICAgIGlzTm9OZXRab25lOiBpc05vTmV0Wm9uZVxuICAgICAgaXNNb29yaW5nQXJlYTogaXNNb29yaW5nQXJlYVxuICAgIFxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHBhcnRpYWxzKVxuICAgIGlmIHJlbmRlck1pbmltdW1XaWR0aFxuICAgICAgQGVuYWJsZUxheWVyVG9nZ2xlcnMoQCRlbClcbiAgICAgIEBkcmF3Vml6KE1JTl9ESUFNKVxuXG4gIGRyYXdWaXo6IChkaWFtKSAtPlxuICAgIGlmIHdpbmRvdy5kM1xuICAgICAgZWwgPSBAJCgnLnZpeicpWzBdXG4gICAgICBtYXhTY2FsZSA9IGQzLm1heChbUkVDT01NRU5ERURfRElBTUVURVIubWF4ICogMS4yLCBkaWFtICogMS4yXSlcbiAgICAgIHJhbmdlcyA9IFtcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdCZWxvdyByZWNvbW1lbmRlZCdcbiAgICAgICAgICBzdGFydDogMFxuICAgICAgICAgIGVuZDogUkVDT01NRU5ERURfRElBTUVURVIubWluXG4gICAgICAgICAgYmc6IFwiIzhlNWU1MFwiXG4gICAgICAgICAgY2xhc3M6ICdiZWxvdydcbiAgICAgICAgfVxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ1JlY29tbWVuZGVkJ1xuICAgICAgICAgIHN0YXJ0OiBSRUNPTU1FTkRFRF9ESUFNRVRFUi5taW5cbiAgICAgICAgICBlbmQ6IFJFQ09NTUVOREVEX0RJQU1FVEVSLm1heFxuICAgICAgICAgIGJnOiAnIzU4OGUzZidcbiAgICAgICAgICBjbGFzczogJ3JlY29tbWVuZGVkJ1xuICAgICAgICB9XG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiAnQWJvdmUgcmVjb21tZW5kZWQnXG4gICAgICAgICAgc3RhcnQ6IFJFQ09NTUVOREVEX0RJQU1FVEVSLm1heFxuICAgICAgICAgIGVuZDogbWF4U2NhbGVcbiAgICAgICAgICBjbGFzczogJ2Fib3ZlJ1xuICAgICAgICB9XG4gICAgICBdXG5cbiAgICAgIHggPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgICAgICAuZG9tYWluKFswLCBtYXhTY2FsZV0pXG4gICAgICAgIC5yYW5nZShbMCwgNDAwXSlcbiAgICAgIFxuICAgICAgY2hhcnQgPSBkMy5zZWxlY3QoZWwpXG4gICAgICBjaGFydC5zZWxlY3RBbGwoXCJkaXYucmFuZ2VcIilcbiAgICAgICAgLmRhdGEocmFuZ2VzKVxuICAgICAgLmVudGVyKCkuYXBwZW5kKFwiZGl2XCIpXG4gICAgICAgIC5zdHlsZShcIndpZHRoXCIsIChkKSAtPiB4KGQuZW5kIC0gZC5zdGFydCkgKyAncHgnKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIChkKSAtPiBcInJhbmdlIFwiICsgZC5jbGFzcylcbiAgICAgICAgLmFwcGVuZChcInNwYW5cIilcbiAgICAgICAgICAudGV4dCgoZCkgLT4gaWYgeChkLmVuZCAtIGQuc3RhcnQpID4gMTEwIHRoZW4gZC5uYW1lIGVsc2UgJycpXG4gICAgICAgICAgLmFwcGVuZChcInNwYW5cIilcbiAgICAgICAgICAgIC50ZXh0IChkKSAtPlxuICAgICAgICAgICAgICBpZiBkLmNsYXNzIGlzICdhYm92ZSdcbiAgICAgICAgICAgICAgICBcIj4gI3tkLnN0YXJ0fSBtaWxlc1wiXG4gICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBcIiN7ZC5zdGFydH0tI3tkLmVuZH0gbWlsZXNcIlxuXG4gICAgICBjaGFydC5zZWxlY3RBbGwoXCJkaXYuZGlhbVwiKVxuICAgICAgICAuZGF0YShbZGlhbV0pXG4gICAgICAuZW50ZXIoKS5hcHBlbmQoXCJkaXZcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImRpYW1cIilcbiAgICAgICAgLnN0eWxlKFwibGVmdFwiLCAoZCkgLT4geChkKSArICdweCcpXG4gICAgICAgIC50ZXh0KChkKSAtPiBcIlwiKVxuXG5cbm1vZHVsZS5leHBvcnRzID0gT3ZlcnZpZXdUYWIiLCJ0aGlzW1wiVGVtcGxhdGVzXCJdID0gdGhpc1tcIlRlbXBsYXRlc1wiXSB8fCB7fTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJhcXVhY3VsdHVyZUZpc2hpbmdWYWx1ZVwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5GaXNoaW5nIFZhbHVlPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoaXMgYXF1YWN1bHR1cmUgYXJlYSBkaXNwbGFjZXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJwZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgb2YgdGhlIGZpc2hpbmcgdmFsdWUgd2l0aGluIEJhcmJ1ZGHigJlzIHdhdGVycywgYmFzZWQgb24gdXNlciByZXBvcnRlZFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICB2YWx1ZXMgb2YgZmlzaGluZyBncm91bmRzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTMzZjE2ZjZhNDk4ODY3YzU2YzZmYjU3XFxcIj5zaG93IGZpc2hpbmcgdmFsdWVzIGxheWVyPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiYXJyYXlGaXNoaW5nVmFsdWVcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RGlzcGxhY2VkIEZpc2hpbmcgVmFsdWU8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJoYXNTYW5jdHVhcmllc1wiLGMscCwxKSxjLHAsMCw4Niw0NjEsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICBUaGlzIHByb3Bvc2FsIGluY2x1ZGVzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibnVtU2FuY3R1YXJpZXNcIixjLHAsMCkpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIFwiKTtpZihfLnMoXy5mKFwic2FuY1BsdXJhbFwiLGMscCwxKSxjLHAsMCwyMDIsMjEzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJTYW5jdHVhcmllc1wiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcInNhbmNQbHVyYWxcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJTYW5jdHVhcnlcIik7fTtfLmIoXCI8L3N0cm9uZz4sXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgZGlzcGxhY2luZyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInNhbmN0dWFyeVBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIGZpc2hpbmcgdmFsdWUgd2l0aGluIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIEJhcmJ1ZGEncyB3YXRlcnMgYmFzZWQgb24gdXNlciByZXBvcnRlZCB2YWx1ZXMgb2YgZmlzaGluZyBncm91bmRzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoXy5zKF8uZihcImhhc05vTmV0Wm9uZXNcIixjLHAsMSksYyxwLDAsNTAzLDkwNSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIFRoaXMgcHJvcG9zYWwgaW5jbHVkZXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJudW1Ob05ldFpvbmVzXCIsYyxwLDApKSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICBcIik7aWYoXy5zKF8uZihcIm5vTmV0Wm9uZXNQbHVyYWxcIixjLHAsMSksYyxwLDAsNjI0LDYzNixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiTm8tTmV0IFpvbmVzXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwibm9OZXRab25lc1BsdXJhbFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIk5vLU5ldCBab25lXCIpO307Xy5iKFwiPC9zdHJvbmc+LFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIGRpc3BsYWNpbmcgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJub05ldFpvbmVzUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgZmlzaGluZyB2YWx1ZSB3aXRoaW4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgQmFyYnVkYSdzIHdhdGVycyBiYXNlZCBvbiB1c2VyIHJlcG9ydGVkIHZhbHVlcyBvZiBmaXNoaW5nIGdyb3VuZHMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3A+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZihfLnMoXy5mKFwiaGFzTW9vcmluZ3NcIixjLHAsMSksYyxwLDAsOTQ0LDEzMjAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICBUaGlzIHByb3Bvc2FsIGluY2x1ZGVzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibnVtTW9vcmluZ3NcIixjLHAsMCkpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIE1vb3JpbmcgYW5kIEFuY2hvcmFnZSBab25lXCIpO2lmKF8ucyhfLmYoXCJtb29yaW5nc1BsdXJhbFwiLGMscCwxKSxjLHAsMCwxMDg3LDEwODgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9zdHJvbmc+LFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIHdoaWNoIG1heSBwb3RlbnRpYWxseSBkaXNwbGFjZSA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm1vb3JpbmdzUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgZmlzaGluZyB2YWx1ZSB3aXRoaW4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgQmFyYnVkYSdzIHdhdGVycyBiYXNlZCBvbiB1c2VyIHJlcG9ydGVkIHZhbHVlcyBvZiBmaXNoaW5nIGdyb3VuZHMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3A+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZihfLnMoXy5mKFwiaGFzU2hpcHBpbmdab25lc1wiLGMscCwxKSxjLHAsMCwxMzYyLDE3NDUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICBUaGlzIHByb3Bvc2FsIGluY2x1ZGVzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibnVtU2hpcHBpbmdab25lc1wiLGMscCwwKSkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgU2hpcHBpbmcgWm9uZVwiKTtpZihfLnMoXy5mKFwic2hpcHBpbmdab25lc1BsdXJhbFwiLGMscCwxKSxjLHAsMCwxNTAyLDE1MDMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9zdHJvbmc+LFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIHdoaWNoIG1heSBwb3RlbnRpYWxseSBkaXNwbGFjZSA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInNoaXBwaW5nWm9uZXNQZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiBmaXNoaW5nIHZhbHVlIHdpdGhpbiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICBCYXJidWRhJ3Mgd2F0ZXJzIGJhc2VkIG9uIHVzZXIgcmVwb3J0ZWQgdmFsdWVzIG9mIGZpc2hpbmcgZ3JvdW5kcy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTMzZjE2ZjZhNDk4ODY3YzU2YzZmYjU3XFxcIj5zaG93IGZpc2hpbmcgdmFsdWVzIGxheWVyPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiYXJyYXlIYWJpdGF0c1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtpZihfLnMoXy5mKFwic2FuY3R1YXJpZXNcIixjLHAsMSksYyxwLDAsMTYsOTE5LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5IYWJpdGF0cyB3aXRoaW4gXCIpO18uYihfLnYoXy5mKFwibnVtU2FuY3R1YXJpZXNcIixjLHAsMCkpKTtfLmIoXCIgXCIpO2lmKCFfLnMoXy5mKFwic2FuY3R1YXJ5UGx1cmFsXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiU2FuY3R1YXJ5XCIpO307aWYoXy5zKF8uZihcInNhbmN0dWFyeVBsdXJhbFwiLGMscCwxKSxjLHAsMCwxNzAsMTgxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJTYW5jdHVhcmllc1wiKTt9KTtjLnBvcCgpO31fLmIoXCI8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkhhYml0YXQ8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPlBlcmNlbnQgb2YgVG90YWwgSGFiaXRhdDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+TWVldHMgMzMlIGdvYWw8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwic2FuY3R1YXJ5SGFiaXRhdFwiLGMscCwxKSxjLHAsMCw0MDMsNjE2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHIgY2xhc3M9XFxcIlwiKTtpZihfLnMoXy5mKFwibWVldHNHb2FsXCIsYyxwLDEpLGMscCwwLDQzNSw0NDIsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIm1ldEdvYWxcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJIYWJUeXBlXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJQZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiICU8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtpZihfLnMoXy5mKFwibWVldHNHb2FsXCIsYyxwLDEpLGMscCwwLDU0NSw1NDgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInllc1wiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcIm1lZXRzR29hbFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIm5vXCIpO307Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFBlcmNlbnRhZ2VzIHNob3duIHJlcHJlc2VudCB0aGUgcHJvcG9ydGlvbiBvZiBoYWJpdGF0cyBhdmFpbGFibGUgaW4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIEJhcmJ1ZGEncyBlbnRpcmUgMyBuYXV0aWNhbCBtaWxlIGJvdW5kYXJ5IGNhcHR1cmVkIHdpdGhpbiBzYW5jdHVhcmllcy4gPGJyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MzNkZGY4NmE0OTg4NjdjNTZjNmM4MzBcXFwiPnNob3cgaGFiaXRhdHMgbGF5ZXI8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJtb29yaW5nc1wiLGMscCwxKSxjLHAsMCw5NTAsMTU2MSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+SGFiaXRhdHMgd2l0aGluIFwiKTtfLmIoXy52KF8uZihcIm51bU1vb3JpbmdzXCIsYyxwLDApKSk7Xy5iKFwiIE1vb3JpbmcgQXJlYVwiKTtpZihfLnMoXy5mKFwibW9vcmluZ1BsdXJhbFwiLGMscCwxKSxjLHAsMCwxMDYyLDEwNjMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5IYWJpdGF0PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5QZXJjZW50IG9mIFRvdGFsIEhhYml0YXQ8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwibW9vcmluZ0RhdGFcIixjLHAsMSksYyxwLDAsMTI0NiwxMzM2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiSGFiVHlwZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiAlPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwhLS0gICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgUGVyY2VudGFnZXMgc2hvd24gcmVwcmVzZW50IHRoZSBwcm9wb3J0aW9uIG9mIGhhYml0YXRzIGF2YWlsYWJsZSBpbiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgQmFyYnVkYSdzIGVudGlyZSAzIG5hdXRpY2FsIG1pbGUgYm91bmRhcnkgY2FwdHVyZWQgd2l0aGluIG1vb3JpbmcgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIGFyZWFzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPiAtLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhhc05vTmV0Wm9uZXNcIixjLHAsMSksYyxwLDAsMTU5NCwyMjEyLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5IYWJpdGF0cyB3aXRoaW4gXCIpO18uYihfLnYoXy5mKFwibnVtTm9OZXRab25lc1wiLGMscCwwKSkpO18uYihcIiBObyBOZXQgWm9uZVwiKTtpZihfLnMoXy5mKFwibm9OZXRab25lc1BsdXJhbFwiLGMscCwxKSxjLHAsMCwxNzEwLDE3MTEsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5IYWJpdGF0PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5QZXJjZW50IG9mIFRvdGFsIEhhYml0YXQ8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwibm9OZXRab25lc0RhdGFcIixjLHAsMSksYyxwLDAsMTkwMCwxOTkwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiSGFiVHlwZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiAlPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPCEtLSA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgUGVyY2VudGFnZXMgc2hvd24gcmVwcmVzZW50IHRoZSBwcm9wb3J0aW9uIG9mIGhhYml0YXRzIGF2YWlsYWJsZSBpbiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgQmFyYnVkYSdzIGVudGlyZSAzIG5hdXRpY2FsIG1pbGUgYm91bmRhcnkgY2FwdHVyZWQgd2l0aGluIG5vIG5ldCB6b25lcy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD4gLS0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5NYXJ4YW4gQW5hbHlzaXMgPGEgc3R5bGU9XFxcInRvcDowcHg7XFxcIiBjbGFzcz1cXFwibWFyeGFuLW5vZGVcXFwiIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjUzM2RlMjBhYTQ5ODg2N2M1NmM2Y2JhNVxcXCI+U2hvdyAnU2NlbmFyaW8gMScgTWFyeGFuIExheWVyPC9hPiZuYnNwPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxzZWxlY3QgY2xhc3M9XFxcImNob3NlblxcXCIgd2lkdGg9XFxcIjQwMHB4XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwibWFyeGFuQW5hbHlzZXNcIixjLHAsMSksYyxwLDAsMjQ4MiwyNTM3LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPG9wdGlvbiB2YWx1ZT1cXFwiXCIpO18uYihfLnYoXy5kKFwiLlwiLGMscCwwKSkpO18uYihcIlxcXCI+U2NlbmFyaW8gXCIpO18uYihfLnYoXy5kKFwiLlwiLGMscCwwKSkpO18uYihcIjwvb3B0aW9uPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICA8L3NlbGVjdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJzY2VuYXJpb1Jlc3VsdHNcXFwiPjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcInZpelxcXCI+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwic2NlbmFyaW9EZXNjcmlwdGlvblxcXCI+PC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJhcnJheU92ZXJ2aWV3XCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO2lmKF8ucyhfLmQoXCJza2V0Y2hDbGFzcy5kZWxldGVkXCIsYyxwLDEpLGMscCwwLDI0LDI3MCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwiYWxlcnQgYWxlcnQtd2FyblxcXCIgc3R5bGU9XFxcIm1hcmdpbi1ib3R0b206MTBweDtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgVGhpcyBza2V0Y2ggd2FzIGNyZWF0ZWQgdXNpbmcgdGhlIFxcXCJcIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiB0ZW1wbGF0ZSwgd2hpY2ggaXNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIG5vIGxvbmdlciBhdmFpbGFibGUuIFlvdSB3aWxsIG5vdCBiZSBhYmxlIHRvIGNvcHkgdGhpcyBza2V0Y2ggb3IgbWFrZSBuZXdcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIHNrZXRjaGVzIG9mIHRoaXMgdHlwZS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiBzaXplXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5TaXplPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaGFzU2tldGNoZXNcIixjLHAsMSksYyxwLDAsMzYzLDg3NCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoaXMgY29sbGVjdGlvbiBpcyBjb21wb3NlZCBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm51bVNrZXRjaGVzXCIsYyxwLDApKSk7Xy5iKFwiIHpvbmVcIik7aWYoXy5zKF8uZihcInNrZXRjaGVzUGx1cmFsXCIsYyxwLDEpLGMscCwwLDQ2OCw0NjksXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9zdHJvbmc+IGluIGJvdGggb2NlYW4gYW5kIGxhZ29vbiB3YXRlcnMuIFRoZSBjb2xsZWN0aW9uIGluY2x1ZGVzIGEgdG90YWwgPGVtPm9jZWFuaWM8L2VtPiBhcmVhIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwic3VtT2NlYW5BcmVhXCIsYyxwLDApKSk7Xy5iKFwiIHNxdWFyZSBtaWxlczwvc3Ryb25nPiwgd2hpY2ggcmVwcmVzZW50cyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInN1bU9jZWFuUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgQmFyYnVkYSdzIHdhdGVycy4gSXQgYWxzbyBpbmNvcnBvcmF0ZXMgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwic3VtTGFnb29uQXJlYVwiLGMscCwwKSkpO18uYihcIiBzcXVhcmUgbWlsZXM8L3N0cm9uZz4sIG9yIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwic3VtTGFnb29uUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4sIG9mIHRoZSB0b3RhbCA8ZW0+bGFnb29uIGFyZWE8L2VtPi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKF8ucyhfLmYoXCJoYXNTYW5jdHVhcmllc1wiLGMscCwxKSxjLHAsMCw5MTQsMTY1MyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoZSBjb2xsZWN0aW9uIGluY2x1ZGVzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibnVtU2FuY3R1YXJpZXNcIixjLHAsMCkpKTtfLmIoXCIgXCIpO2lmKCFfLnMoXy5mKFwic2FuY3R1YXJpZXNQbHVyYWxcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJzYW5jdHVhcnlcIik7fTtpZihfLnMoXy5mKFwic2FuY3R1YXJpZXNQbHVyYWxcIixjLHAsMSksYyxwLDAsMTA2NywxMDc4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzYW5jdHVhcmllc1wiKTt9KTtjLnBvcCgpO31fLmIoXCI8L3N0cm9uZz4gaW4gYm90aCBvY2VhbiBhbmQgbGFnb29uIHdhdGVycy4gVGhlIFwiKTtpZighXy5zKF8uZihcInNhbmN0dWFyaWVzUGx1cmFsXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwic2FuY3R1YXJ5XCIpO307aWYoXy5zKF8uZihcInNhbmN0dWFyaWVzUGx1cmFsXCIsYyxwLDEpLGMscCwwLDEyMjIsMTIzMyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic2FuY3R1YXJpZXNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiIGNvbnRhaW5cIik7aWYoIV8ucyhfLmYoXCJzYW5jdHVhcmllc1BsdXJhbFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcInNcIik7fTtfLmIoXCIgYSB0b3RhbCA8ZW0+b2NlYW5pYzwvZW0+IGFyZWEgb2YgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJzYW5jdHVhcnlPY2VhbkFyZWFcIixjLHAsMCkpKTtfLmIoXCIgc3F1YXJlIG1pbGVzPC9zdHJvbmc+LCBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgd2hpY2ggcmVwcmVzZW50cyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInNhbmN0dWFyeU9jZWFuUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgQmFyYnVkYSdzIHdhdGVycy4gSXQgYWxzbyBpbmNsdWRlcyBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJzYW5jdHVhcnlMYWdvb25BcmVhXCIsYyxwLDApKSk7Xy5iKFwiIHNxdWFyZSBtaWxlczwvc3Ryb25nPiwgb3IgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJzYW5jdHVhcnlMYWdvb25QZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiwgb2YgdGhlIHRvdGFsIDxlbT5sYWdvb24gYXJlYTwvZW0+LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoXy5zKF8uZihcImhhc05vTmV0Wm9uZXNcIixjLHAsMSksYyxwLDAsMTY5MywyMzI5LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhlIGNvbGxlY3Rpb24gaW5jbHVkZXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJudW1Ob05ldFpvbmVzXCIsYyxwLDApKSk7Xy5iKFwiIE5vIE5ldCBab25lXCIpO2lmKF8ucyhfLmYoXCJub05ldFpvbmVzUGx1cmFsXCIsYyxwLDEpLGMscCwwLDE4MDIsMTgwMyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic1wiKTt9KTtjLnBvcCgpO31fLmIoXCI8L3N0cm9uZz4gaW4gYm90aCBvY2VhbiBhbmQgbGFnb29uIHdhdGVycy4gVGhlIE5vIE5ldCBab25lXCIpO2lmKF8ucyhfLmYoXCJub05ldFpvbmVzUGx1cmFsXCIsYyxwLDEpLGMscCwwLDE5MDMsMTkwNCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic1wiKTt9KTtjLnBvcCgpO31fLmIoXCI8L3N0cm9uZz4gY29udGFpblwiKTtpZighXy5zKF8uZihcIm5vTmV0Wm9uZXNQbHVyYWxcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJzXCIpO307Xy5iKFwiIGEgdG90YWwgPGVtPm9jZWFuaWM8L2VtPiBhcmVhIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibm9OZXRab25lc09jZWFuQXJlYVwiLGMscCwwKSkpO18uYihcIiBzcXVhcmUgbWlsZXM8L3N0cm9uZz4sIHdoaWNoIHJlcHJlc2VudHMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJub05ldFpvbmVzT2NlYW5QZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiBCYXJidWRhJ3Mgd2F0ZXJzLiBJdCBhbHNvIGluY2x1ZGVzIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm5vTmV0Wm9uZXNMYWdvb25BcmVhXCIsYyxwLDApKSk7Xy5iKFwiIHNxdWFyZSBtaWxlczwvc3Ryb25nPiwgb3IgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJub05ldFpvbmVzTGFnb29uUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4sIG9mIHRoZSB0b3RhbCA8ZW0+bGFnb29uIGFyZWE8L2VtPi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKF8ucyhfLmYoXCJoYXNNb29yaW5nc1wiLGMscCwxKSxjLHAsMCwyMzY2LDI5NzgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGUgY29sbGVjdGlvbiBpbmNsdWRlcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm51bU1vb3JpbmdzXCIsYyxwLDApKSk7Xy5iKFwiIE1vb3JpbmcgQXJlYVwiKTtpZihfLnMoXy5mKFwibW9vcmluZ3NQbHVyYWxcIixjLHAsMSksYyxwLDAsMjQ3MiwyNDczLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzXCIpO30pO2MucG9wKCk7fV8uYihcIjwvc3Ryb25nPiBpbiBib3RoIG9jZWFuIGFuZCBsYWdvb24gd2F0ZXJzLiBUaGUgTW9vcmluZyBBcmVhXCIpO2lmKF8ucyhfLmYoXCJtb29yaW5nc1BsdXJhbFwiLGMscCwxKSxjLHAsMCwyNTcwLDI1NzEsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiIGNvbnRhaW5cIik7aWYoIV8ucyhfLmYoXCJtb29yaW5nc1BsdXJhbFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcInNcIik7fTtfLmIoXCIgYSB0b3RhbCA8ZW0+b2NlYW5pYzwvZW0+IGFyZWEgb2YgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJtb29yaW5nc09jZWFuQXJlYVwiLGMscCwwKSkpO18uYihcIiBzcXVhcmUgbWlsZXM8L3N0cm9uZz4sIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICB3aGljaCByZXByZXNlbnRzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibW9vcmluZ3NPY2VhblBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIEJhcmJ1ZGEncyB3YXRlcnMuIEl0IGFsc28gaW5jbHVkZXMgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibW9vcmluZ3NMYWdvb25BcmVhXCIsYyxwLDApKSk7Xy5iKFwiIHNxdWFyZSBtaWxlczwvc3Ryb25nPiwgb3IgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJtb29yaW5nc0xhZ29vblBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+LCBvZiB0aGUgdG90YWwgPGVtPmxhZ29vbiBhcmVhPC9lbT4uXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZihfLnMoXy5mKFwiaGFzQXF1YWN1bHR1cmVcIixjLHAsMSksYyxwLDAsMzAxNiwzNjY0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhlIGNvbGxlY3Rpb24gaW5jbHVkZXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJudW1BcXVhY3VsdHVyZVwiLGMscCwwKSkpO18uYihcIiBBcXVhY3VsdHVyZSBBcmVhXCIpO2lmKF8ucyhfLmYoXCJhcXVhY3VsdHVyZVBsdXJhbFwiLGMscCwxKSxjLHAsMCwzMTMyLDMxMzMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9zdHJvbmc+IGluIGJvdGggb2NlYW4gYW5kIGxhZ29vbiB3YXRlcnMuIFRoZSBBcXVhY3VsdHVyZSBBcmVhXCIpO2lmKF8ucyhfLmYoXCJhcXVhY3VsdHVyZVBsdXJhbFwiLGMscCwxKSxjLHAsMCwzMjQwLDMyNDEsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiIGNvbnRhaW5cIik7aWYoIV8ucyhfLmYoXCJhcXVhY3VsdHVyZVBsdXJhbFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcInNcIik7fTtfLmIoXCIgYSB0b3RhbCA8ZW0+b2NlYW5pYzwvZW0+IGFyZWEgb2YgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJhcXVhY3VsdHVyZU9jZWFuQXJlYVwiLGMscCwwKSkpO18uYihcIiBzcXVhcmUgbWlsZXM8L3N0cm9uZz4sIHdoaWNoIHJlcHJlc2VudHMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJhcXVhY3VsdHVyZU9jZWFuUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgQmFyYnVkYSdzIHdhdGVycy4gSXQgYWxzbyBpbmNsdWRlcyBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJhcXVhY3VsdHVyZUxhZ29vbkFyZWFcIixjLHAsMCkpKTtfLmIoXCIgc3F1YXJlIG1pbGVzPC9zdHJvbmc+LCBvciA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImFxdWFjdWx0dXJlTGFnb29uUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4sIG9mIHRoZSB0b3RhbCA8ZW0+bGFnb29uIGFyZWE8L2VtPi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKF8ucyhfLmYoXCJoYXNGaXNoaW5nQXJlYXNcIixjLHAsMSksYyxwLDAsMzcwNiw0Mzc1LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhlIGNvbGxlY3Rpb24gaW5jbHVkZXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJudW1GaXNoaW5nQXJlYXNcIixjLHAsMCkpKTtfLmIoXCIgRmlzaGluZyBQcmlvcml0eSBBcmVhXCIpO2lmKF8ucyhfLmYoXCJmaXNoaW5nQXJlYXNQbHVyYWxcIixjLHAsMSksYyxwLDAsMzgyOSwzODMwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzXCIpO30pO2MucG9wKCk7fV8uYihcIjwvc3Ryb25nPiBpbiBib3RoIG9jZWFuIGFuZCBsYWdvb24gd2F0ZXJzLiBUaGUgRmlzaGluZyBQcmlvcml0eSBBcmVhXCIpO2lmKF8ucyhfLmYoXCJmaXNoaW5nQXJlYXNQbHVyYWxcIixjLHAsMSksYyxwLDAsMzk0NCwzOTQ1LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzXCIpO30pO2MucG9wKCk7fV8uYihcIiBjb250YWluXCIpO2lmKCFfLnMoXy5mKFwiZmlzaGluZ0FyZWFzUGx1cmFsXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwic1wiKTt9O18uYihcIiBhIHRvdGFsIDxlbT5vY2VhbmljPC9lbT4gYXJlYSBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImZpc2hpbmdBcmVhc09jZWFuQXJlYVwiLGMscCwwKSkpO18uYihcIiBzcXVhcmUgbWlsZXM8L3N0cm9uZz4sIHdoaWNoIHJlcHJlc2VudHMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJmaXNoaW5nQXJlYXNPY2VhblBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIEJhcmJ1ZGEncyB3YXRlcnMuIEl0IGFsc28gaW5jbHVkZXMgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiZmlzaGluZ0FyZWFzTGFnb29uQXJlYVwiLGMscCwwKSkpO18uYihcIiBzcXVhcmUgbWlsZXM8L3N0cm9uZz4sIG9yIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiZmlzaGluZ0FyZWFzTGFnb29uUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4sIG9mIHRoZSB0b3RhbCA8ZW0+bGFnb29uIGFyZWE8L2VtPi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwhLS1cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5ab25lcyBpbiB0aGlzIFByb3Bvc2FsPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcInRvY0NvbnRhaW5lclxcXCI+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiLS0+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImFueUF0dHJpYnV0ZXNcIixjLHAsMSksYyxwLDAsNDUzNCw0NjU4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5cIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiIEF0dHJpYnV0ZXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihfLnJwKFwiYXR0cmlidXRlcy9hdHRyaWJ1dGVzVGFibGVcIixjLHAsXCIgIFwiKSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiYXJyYXlUcmFkZW9mZnNcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+VHJhZGVvZmZzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0PHAgY2xhc3M9XFxcImxhcmdlXFxcIiBzdHlsZT1cXFwibWFyZ2luLWxlZnQ6MTVweDtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgXHRcdDxhIGhyZWYgPSBcXFwiaHR0cDovL21jY2xpbnRvY2subXNpLnVjc2IuZWR1L2Jsb2cvdHJhZGVvZmYtYW5hbHlzZXMtaW4tc2Vhc2tldGNoXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+VHJhZGVvZmYgQW5hbHlzaXM8L2E+IGV4YW1pbmVzIHRoZSBpbXBhY3Qgb2YgbG9ic3RlciBhbmQgY29uY2ggZmlzaGluZyBvbiByZWxhdGl2ZSBlY29sb2dpY2FsIGFuZCBmaXNoaW5nIHZhbHVlcy4gUHJldmVudGluZyBmaXNoaW5nIGluIGFuIGFyZWEgZ2VuZXJhbGx5XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdFx0aW5jcmVhc2VzIHRoZSBlY29sb2dpY2FsIHNjb3JlIGJ5IHJlZHVjaW5nIGltcGFjdHMgYW5kIGRlY3JlYXNlcyBmaXNoaW5nIHZhbHVlcyBieSByZWR1Y2luZyBmaXNoaW5nIHRha2UuIFN0b3BwaW5nIGZpc2hpbmcgaW4gc29tZSBhcmVhcywgc3VjaCBhcyBudXJzZXJ5IGdyb3VuZHMsIGNhblwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgXHRcdGluY3JlYXNlIGJvdGggc2NvcmVzIGJ5IHJlZHVjaW5nIGVjb2xvZ2ljYWwgaW1wYWN0cyBhbmQgaW5jcmVhc2luZyBmaXNoIHN0b2Nrcy4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdDxwIGNsYXNzPVxcXCJzbWFsbCB0dGlwLXRpcFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgICBUaXA6IGhvdmVyIG92ZXIgYSBwcm9wb3NhbCB0byBzZWUgZGV0YWlsc1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0PC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgXHQ8ZGl2ICBpZD1cXFwidHJhZGVvZmYtY2hhcnRcXFwiIGNsYXNzPVxcXCJ0cmFkZW9mZi1jaGFydFxcXCI+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcImRlbW9cIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+UmVwb3J0IFNlY3Rpb25zPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPlVzZSByZXBvcnQgc2VjdGlvbnMgdG8gZ3JvdXAgaW5mb3JtYXRpb24gaW50byBtZWFuaW5nZnVsIGNhdGVnb3JpZXM8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5EMyBWaXN1YWxpemF0aW9uczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dWwgY2xhc3M9XFxcIm5hdiBuYXYtcGlsbHNcXFwiIGlkPVxcXCJ0YWJzMlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxsaSBjbGFzcz1cXFwiYWN0aXZlXFxcIj48YSBocmVmPVxcXCIjY2hhcnRcXFwiPkNoYXJ0PC9hPjwvbGk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxsaT48YSBocmVmPVxcXCIjZGF0YVRhYmxlXFxcIj5UYWJsZTwvYT48L2xpPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC91bD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcInRhYi1jb250ZW50XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwidGFiLXBhbmUgYWN0aXZlXFxcIiBpZD1cXFwiY2hhcnRcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwhLS1baWYgSUUgOF0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHAgY2xhc3M9XFxcInVuc3VwcG9ydGVkXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICBUaGlzIHZpc3VhbGl6YXRpb24gaXMgbm90IGNvbXBhdGlibGUgd2l0aCBJbnRlcm5ldCBFeHBsb3JlciA4LiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICBQbGVhc2UgdXBncmFkZSB5b3VyIGJyb3dzZXIsIG9yIHZpZXcgcmVzdWx0cyBpbiB0aGUgdGFibGUgdGFiLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvcD4gICAgICBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8IVtlbmRpZl0tLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIFNlZSA8Y29kZT5zcmMvc2NyaXB0cy9kZW1vLmNvZmZlZTwvY29kZT4gZm9yIGFuIGV4YW1wbGUgb2YgaG93IHRvIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgdXNlIGQzLmpzIHRvIHJlbmRlciB2aXN1YWxpemF0aW9ucy4gUHJvdmlkZSBhIHRhYmxlLWJhc2VkIHZpZXdcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIGFuZCB1c2UgY29uZGl0aW9uYWwgY29tbWVudHMgdG8gcHJvdmlkZSBhIGZhbGxiYWNrIGZvciBJRTggdXNlcnMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8YnI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8YSBocmVmPVxcXCJodHRwOi8vdHdpdHRlci5naXRodWIuaW8vYm9vdHN0cmFwLzIuMy4yL1xcXCI+Qm9vdHN0cmFwIDIueDwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIGlzIGxvYWRlZCB3aXRoaW4gU2VhU2tldGNoIHNvIHlvdSBjYW4gdXNlIGl0IHRvIGNyZWF0ZSB0YWJzIGFuZCBvdGhlciBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIGludGVyZmFjZSBjb21wb25lbnRzLiBqUXVlcnkgYW5kIHVuZGVyc2NvcmUgYXJlIGFsc28gYXZhaWxhYmxlLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcInRhYi1wYW5lXFxcIiBpZD1cXFwiZGF0YVRhYmxlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+aW5kZXg8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD52YWx1ZTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJjaGFydERhdGFcIixjLHAsMSksYyxwLDAsMTM1MSwxNDE4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgPHRyPjx0ZD5cIik7Xy5iKF8udihfLmYoXCJpbmRleFwiLGMscCwwKSkpO18uYihcIjwvdGQ+PHRkPlwiKTtfLmIoXy52KF8uZihcInZhbHVlXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD48L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgICAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIGVtcGhhc2lzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5FbXBoYXNpczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5HaXZlIHJlcG9ydCBzZWN0aW9ucyBhbiA8Y29kZT5lbXBoYXNpczwvY29kZT4gY2xhc3MgdG8gaGlnaGxpZ2h0IGltcG9ydGFudCBpbmZvcm1hdGlvbi48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHdhcm5pbmdcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0Pldhcm5pbmc8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+T3IgPGNvZGU+d2FybjwvY29kZT4gb2YgcG90ZW50aWFsIHByb2JsZW1zLjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gZGFuZ2VyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5EYW5nZXI8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+PGNvZGU+ZGFuZ2VyPC9jb2RlPiBjYW4gYWxzbyBiZSB1c2VkLi4uIHNwYXJpbmdseS48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcImZpc2hpbmdQcmlvcml0eUFyZWFcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RmlzaGluZyBWYWx1ZTwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGlzIGZpc2hpbmcgcHJpb3JpdHkgYXJlYSBpbmNsdWRlcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIHRoZSBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgZmlzaGluZyB2YWx1ZSB3aXRoaW4gQmFyYnVkYSdzIHdhdGVycywgYmFzZWQgb24gdXNlciByZXBvcnRlZCB2YWx1ZXMgb2YgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIGZpc2hpbmcgZ3JvdW5kc1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTMzZjE2ZjZhNDk4ODY3YzU2YzZmYjU3XFxcIj5zaG93IGZpc2hpbmcgdmFsdWVzIGxheWVyPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiZmlzaGluZ1ZhbHVlXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkZpc2hpbmcgVmFsdWU8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhpcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImFyZWFMYWJlbFwiLGMscCwwKSkpO18uYihcIjwvc3Ryb25nPiBcIik7aWYoXy5zKF8uZihcImlzTW9vcmluZ09yU2hpcHBpbmdcIixjLHAsMSksYyxwLDAsMTM3LDE2MSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwibWF5IHBvdGVudGlhbGx5IGRpc3BsYWNlXCIpO30pO2MucG9wKCk7fV8uYihcIiBcIik7aWYoIV8ucyhfLmYoXCJpc01vb3JpbmdPclNoaXBwaW5nXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiZGlzcGxhY2VzXCIpO307Xy5iKFwiIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIHRoZSBmaXNoaW5nIHZhbHVlIHdpdGhpbiBCYXJidWRh4oCZcyB3YXRlcnMsIGJhc2VkIG9uIHVzZXIgcmVwb3J0ZWRcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgdmFsdWVzIG9mIGZpc2hpbmcgZ3JvdW5kcy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjUzM2YxNmY2YTQ5ODg2N2M1NmM2ZmI1N1xcXCI+c2hvdyBmaXNoaW5nIHZhbHVlcyBsYXllcjwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcImhhYml0YXRcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+XCIpO18uYihfLnYoXy5mKFwiaGVhZGluZ1wiLGMscCwwKSkpO18uYihcIiA8YSBocmVmPVxcXCIjXFxcIiBzdHlsZT1cXFwidG9wOjBweDtcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjUzM2RkZjg2YTQ5ODg2N2M1NmM2YzgzMFxcXCI+c2hvdyBoYWJpdGF0cyBsYXllcjwvYT48L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkhhYml0YXQ8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPiUgb2YgVG90YWwgSGFiaXRhdDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJoYWJpdGF0c1wiLGMscCwxKSxjLHAsMCwzMTMsMzc2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+PHRkPlwiKTtfLmIoXy52KF8uZihcIkhhYlR5cGVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPjx0ZD5cIik7Xy5iKF8udihfLmYoXCJQZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiPC90ZD48L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFBlcmNlbnRhZ2VzIHNob3duIHJlcHJlc2VudCB0aGUgcHJvcG9ydGlvbiBvZiBoYWJpdGF0cyBhdmFpbGFibGUgaW4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIEJhcmJ1ZGEncyBlbnRpcmUgMyBuYXV0aWNhbCBtaWxlIGJvdW5kYXJ5IGNhcHR1cmVkIHdpdGhpbiB0aGlzIHpvbmUuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+TWFyeGFuIEFuYWx5c2lzIDxhIHN0eWxlPVxcXCJ0b3A6MHB4O1xcXCIgY2xhc3M9XFxcIm1hcnhhbi1ub2RlXFxcIiBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MzNkZTIwYWE0OTg4NjdjNTZjNmNiYTVcXFwiPlNob3cgJ1NjZW5hcmlvIDEnIE1hcnhhbiBMYXllcjwvYT4mbmJzcDwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8c2VsZWN0IGNsYXNzPVxcXCJjaG9zZW5cXFwiIHdpZHRoPVxcXCIzODBweFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcIm1hcnhhbkFuYWx5c2VzXCIsYyxwLDEpLGMscCwwLDgzMSw4ODYsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8b3B0aW9uIHZhbHVlPVxcXCJcIik7Xy5iKF8udihfLmQoXCIuXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5TY2VuYXJpbyBcIik7Xy5iKF8udihfLmQoXCIuXCIsYyxwLDApKSk7Xy5iKFwiPC9vcHRpb24+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgIDwvc2VsZWN0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcInNjZW5hcmlvUmVzdWx0c1xcXCI+PC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGRpdiBjbGFzcz1cXFwidml6XFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJzY2VuYXJpb0Rlc2NyaXB0aW9uXFxcIj48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJvdmVydmlld1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtpZihfLnMoXy5kKFwic2tldGNoQ2xhc3MuZGVsZXRlZFwiLGMscCwxKSxjLHAsMCwyNCwyNzAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcImFsZXJ0IGFsZXJ0LXdhcm5cXFwiIHN0eWxlPVxcXCJtYXJnaW4tYm90dG9tOjEwcHg7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFRoaXMgc2tldGNoIHdhcyBjcmVhdGVkIHVzaW5nIHRoZSBcXFwiXCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIlxcXCIgdGVtcGxhdGUsIHdoaWNoIGlzXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBubyBsb25nZXIgYXZhaWxhYmxlLiBZb3Ugd2lsbCBub3QgYmUgYWJsZSB0byBjb3B5IHRoaXMgc2tldGNoIG9yIG1ha2UgbmV3XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBza2V0Y2hlcyBvZiB0aGlzIHR5cGUuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gc2l6ZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+U2l6ZTwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGlzIGFyZWEgaXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJTUV9NSUxFU1wiLGMscCwwKSkpO18uYihcIiBzcXVhcmUgbWlsZXM8L3N0cm9uZz4sXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIHdoaWNoIHJlcHJlc2VudHMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJQRVJDRU5UXCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiBCYXJidWRhJ3Mgd2F0ZXJzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcInJlbmRlck1pbmltdW1XaWR0aFwiLGMscCwxKSxjLHAsMCw1MzYsMTE3OCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiBkaWFtZXRlciBcIik7aWYoIV8ucyhfLmYoXCJESUFNX09LXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwid2FybmluZ1wiKTt9O18uYihcIlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+TWluaW11bSBXaWR0aDwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGUgbWluaW11bSB3aWR0aCBvZiBhIHpvbmUgc2lnbmlmaWNhbnRseSBpbXBhY3RzICBpdHMgY29uc2VydmF0aW9uIHZhbHVlLiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhlIHJlY29tbWVuZGVkIHNtYWxsZXN0IGRpYW1ldGVyIGlzIGJldHdlZW4gMiBhbmQgMyBtaWxlcy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHN0cm9uZz5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZighXy5zKF8uZihcIkRJQU1fT0tcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgICAgVGhpcyBkZXNpZ24gZmFsbHMgb3V0c2lkZSB0aGUgcmVjb21tZW5kYXRpb24gYXQgXCIpO18uYihfLnYoXy5mKFwiRElBTVwiLGMscCwwKSkpO18uYihcIiBtaWxlcy5cIik7Xy5iKFwiXFxuXCIpO307aWYoXy5zKF8uZihcIkRJQU1fT0tcIixjLHAsMSksYyxwLDAsOTI2LDk5NyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIFRoaXMgZGVzaWduIGZpdHMgd2l0aGluIHRoZSByZWNvbW1lbmRhdGlvbiBhdCBcIik7Xy5iKF8udihfLmYoXCJESUFNXCIsYyxwLDApKSk7Xy5iKFwiIG1pbGVzLlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvc3Ryb25nPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGRpdiBjbGFzcz1cXFwidml6XFxcIiBzdHlsZT1cXFwicG9zaXRpb246cmVsYXRpdmU7XFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxpbWcgc3JjPVxcXCJodHRwOi8vczMuYW1hem9uYXdzLmNvbS9TZWFTa2V0Y2gvcHJvamVjdHMvYmFyYnVkYS9taW5fd2lkdGhfZXhhbXBsZS5wbmdcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiYW55QXR0cmlidXRlc1wiLGMscCwxKSxjLHAsMCwxMjIxLDEzNDUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCIgQXR0cmlidXRlczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKF8ucnAoXCJhdHRyaWJ1dGVzL2F0dHJpYnV0ZXNUYWJsZVwiLGMscCxcIiAgXCIpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31yZXR1cm4gXy5mbCgpOzt9KTtcblxuaWYodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICBtb2R1bGUuZXhwb3J0cyA9IHRoaXNbXCJUZW1wbGF0ZXNcIl07XG59Il19
