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
        var problem, result, _i, _len, _ref, _ref1;
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
    var left, total,
      _this = this;
    if (this.maxEta) {
      total = (new Date(this.maxEta).getTime() - new Date(this.etaStart).getTime()) / 1000;
      left = (new Date(this.maxEta).getTime() - new Date().getTime()) / 1000;
      _.delay(function() {
        return _this.reportResults.poll();
      }, (left + 1) * 1000);
      return _.delay(function() {
        _this.$('.progress .bar').css('transition-timing-function', 'linear');
        _this.$('.progress .bar').css('transition-duration', "" + (left + 1) + "s");
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
      if (job.get('eta')) {
        if (!maxEta || job.get('eta') > maxEta) {
          maxEta = job.get('eta');
        }
      }
    }
    if (maxEta) {
      this.maxEta = maxEta;
      this.$('.progress .bar').width('5%');
      this.etaStart = new Date();
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

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = this["Templates"];
}
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
    var areaLabel, context, isMooringArea;
    isMooringArea = this.sketchClass.id === MOORING_ID;
    areaLabel = this.sketchClass.attributes.name;
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user),
      percent: this.recordSet('FishingValue', 'FishingValue').float('PERCENT', 2),
      areaLabel: areaLabel,
      isMooringArea: isMooringArea
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
    var color, data, domain, el, height, histo, i, margin, max_q, min_q, name, q, quantile, quantile_desc, quantile_range, quantiles, records, svg, width, x, xAxis, y, yAxis, _i, _j, _len, _len1;
    if (window.d3) {
      name = this.$('.chosen').val();
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
      this.$('.scenarioResults').html("The average Marxan score for this zone is <strong>" + data.SCORE + "</strong>, placing it in \nthe <strong>" + quantile_desc + "</strong> quantile range <strong>(" + (min_q.replace('Q', '')) + "% - " + (max_q.replace('Q', '')) + "%)</strong> \nfor this sub-region. All Marxan planning units for the sub-region have been ranked by sum solution \nscore and divided into five quantiles of equal proportion.");
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
  NO_NET_ZONES_ID: '533de620a498867c56c6cfc2'
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
    var DIAM_OK, MIN_DIAM, PERCENT, SQ_MILES, context, isMooringArea, isNoNetZone, renderMinimumWidth, skid, _ref1;
    MIN_DIAM = this.recordSet('Diameter', 'Diameter').float('MIN_DIAM');
    SQ_MILES = this.recordSet('Diameter', 'Diameter').float('SQ_MILES');
    PERCENT = (SQ_MILES / TOTAL_AREA) * 100.0;
    if (MIN_DIAM > RECOMMENDED_DIAMETER.min) {
      DIAM_OK = true;
    }
    skid = this.model.getAttribute('SC_ID');
    isNoNetZone = this.sketchClass.id === NO_NET_ZONES_ID;
    isMooringArea = this.sketchClass.id === MOORING_ID;
    renderMinimumWidth = !isNoNetZone && !isMooringArea;
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
this["Templates"]["arrayFishingValue"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Displaced Fishing Value</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);if(_.s(_.f("sanctuaries",c,p,1),c,p,0,103,389,"{{ }}")){_.rs(c,p,function(c,p,_){if(_.s(_.f("aquacultureAreas",c,p,1),c,p,0,129,363,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    This proposal includes both Sanctuary and Aquaculture areas, displacing");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("sanctuaryPercent",c,p,0)));_.b("%</strong> and <strong>");_.b(_.v(_.f("aquacultureAreaPercent",c,p,0)));_.b("%</strong> ");_.b("\n" + i);_.b("    of fishing value within Barbuda's waters, respectively.");_.b("\n");});c.pop();}});c.pop();}if(_.s(_.f("sanctuaries",c,p,1),c,p,0,426,765,"{{ }}")){_.rs(c,p,function(c,p,_){if(!_.s(_.f("aquacultureAreas",c,p,1),c,p,1,0,0,"")){_.b("    This proposal includes ");_.b(_.v(_.f("numSanctuaries",c,p,0)));_.b("\n" + i);_.b("    ");if(_.s(_.f("sancPlural",c,p,1),c,p,0,518,529,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("Sanctuaries");});c.pop();}if(!_.s(_.f("sancPlural",c,p,1),c,p,1,0,0,"")){_.b("Sanctuary");};_.b(",");_.b("\n" + i);_.b("    displacing <strong>");_.b(_.v(_.f("sanctuaryPercent",c,p,0)));_.b("%</strong> of fishing value within ");_.b("\n" + i);_.b("    Barbuda's waters based on user reported values of fishing grounds.");_.b("\n");};});c.pop();}if(!_.s(_.f("sanctuaries",c,p,1),c,p,1,0,0,"")){if(_.s(_.f("aquacultureAreas",c,p,1),c,p,0,828,1135,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <br>");_.b("\n" + i);_.b("    <br>");_.b("\n" + i);_.b("    This proposal includes ");_.b(_.v(_.f("numAquacultureAreas",c,p,0)));_.b("\n" + i);_.b("    Aquaculture Area");if(_.s(_.f("aquacultureAreasPlural",c,p,1),c,p,0,945,946,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b(",");_.b("\n" + i);_.b("    displacing <strong>");_.b(_.v(_.f("aquacultureAreaPercent",c,p,0)));_.b("%</strong> of fishing value within ");_.b("\n" + i);_.b("    Barbuda's waters based on user reported values of fishing grounds.");_.b("\n");});c.pop();}};if(_.s(_.f("moorings",c,p,1),c,p,0,1195,1525,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <br>");_.b("\n" + i);_.b("    <br>");_.b("\n" + i);_.b("    ");_.b(_.v(_.f("numMoorings",c,p,0)));_.b(" Mooring Area");if(_.s(_.f("mooringsPlural",c,p,1),c,p,0,1265,1270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s are");});c.pop();}_.b(" ");if(!_.s(_.f("mooringsPlural",c,p,1),c,p,1,0,0,"")){_.b("is");};_.b("\n" + i);_.b("    also included, which cover");if(!_.s(_.f("mooringsPlural",c,p,1),c,p,1,0,0,"")){_.b("s");};_.b(" <strong>");_.b(_.v(_.f("mooringAreaPercent",c,p,0)));_.b("%</strong> of ");_.b("\n" + i);_.b("    regional fishing value. Mooring areas may displace fishing activities.");_.b("\n");});c.pop();}if(_.s(_.f("hasNoNetZones",c,p,1),c,p,0,1561,1903,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <br>");_.b("\n" + i);_.b("    <br>");_.b("\n" + i);_.b("    ");_.b(_.v(_.f("numNoNetZones",c,p,0)));_.b(" Not Net Zone");if(_.s(_.f("noNetZonesPlural",c,p,1),c,p,0,1635,1640,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s are");});c.pop();}_.b(" ");if(!_.s(_.f("noNetZonesPlural",c,p,1),c,p,1,0,0,"")){_.b("is");};_.b("\n" + i);_.b("    also included, which cover");if(!_.s(_.f("noNetZonesPlural",c,p,1),c,p,1,0,0,"")){_.b("s");};_.b(" <strong>");_.b(_.v(_.f("noNetZonesPercent",c,p,0)));_.b("%</strong> of ");_.b("\n" + i);_.b("    regional fishing value. No Net Zones may displace fishing activities.");_.b("\n");});c.pop();}_.b("  </p>");_.b("\n" + i);_.b("  <a href=\"#\" data-toggle-node=\"533f16f6a498867c56c6fb57\">show fishing values layer</a>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);if(_.s(_.f("fishingAreas",c,p,1),c,p,0,2042,2414,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Priority Fishing Areas</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This proposal includes ");_.b(_.v(_.f("numFishingAreas",c,p,0)));_.b(" Fishing Priority ");_.b("\n" + i);_.b("    Area");if(_.s(_.f("fishingAreaPural",c,p,1),c,p,0,2219,2220,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b(", representing");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("fishingAreaPercent",c,p,0)));_.b("%</strong> of the fishing value within Barbuda's ");_.b("\n" + i);_.b("    waters based on user reported values of fishing grounds");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}return _.fl();;});
this["Templates"]["arrayHabitats"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.f("sanctuaries",c,p,1),c,p,0,16,919,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Habitats within ");_.b(_.v(_.f("numSanctuaries",c,p,0)));_.b(" ");if(!_.s(_.f("sanctuaryPlural",c,p,1),c,p,1,0,0,"")){_.b("Sanctuary");};if(_.s(_.f("sanctuaryPlural",c,p,1),c,p,0,170,181,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("Sanctuaries");});c.pop();}_.b("</h4>");_.b("\n" + i);_.b("  <table>");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Habitat</th>");_.b("\n" + i);_.b("        <th>Percent of Total Habitat</th>");_.b("\n" + i);_.b("        <th>Meets 33% goal</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("sanctuaryHabitat",c,p,1),c,p,0,403,616,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr class=\"");if(_.s(_.f("meetsGoal",c,p,1),c,p,0,435,442,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("metGoal");});c.pop();}_.b("\">");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HabType",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Percent",c,p,0)));_.b(" %</td>");_.b("\n" + i);_.b("        <td>");if(_.s(_.f("meetsGoal",c,p,1),c,p,0,545,548,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("yes");});c.pop();}if(!_.s(_.f("meetsGoal",c,p,1),c,p,1,0,0,"")){_.b("no");};_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    Percentages shown represent the proportion of habitats available in ");_.b("\n" + i);_.b("    Barbuda's entire 3 nautical mile boundary captured within sanctuaries. <br>");_.b("\n" + i);_.b("    <a href=\"#\" data-toggle-node=\"533ddf86a498867c56c6c830\">show habitats layer</a>");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);if(_.s(_.f("moorings",c,p,1),c,p,0,950,1561,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Habitats within ");_.b(_.v(_.f("numMoorings",c,p,0)));_.b(" Mooring Area");if(_.s(_.f("mooringPlural",c,p,1),c,p,0,1062,1063,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</h4>");_.b("\n" + i);_.b("  <table>");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Habitat</th>");_.b("\n" + i);_.b("        <th>Percent of Total Habitat</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("mooringData",c,p,1),c,p,0,1246,1336,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HabType",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Percent",c,p,0)));_.b(" %</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("<!--   <p>");_.b("\n" + i);_.b("    Percentages shown represent the proportion of habitats available in ");_.b("\n" + i);_.b("    Barbuda's entire 3 nautical mile boundary captured within mooring ");_.b("\n" + i);_.b("    areas.");_.b("\n" + i);_.b("  </p> -->");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("\n" + i);if(_.s(_.f("hasNoNetZones",c,p,1),c,p,0,1595,2213,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Habitats within ");_.b(_.v(_.f("numNoNetZones",c,p,0)));_.b(" No Net Zone");if(_.s(_.f("noNetZonesPlural",c,p,1),c,p,0,1711,1712,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</h4>");_.b("\n" + i);_.b("  <table>");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Habitat</th>");_.b("\n" + i);_.b("        <th>Percent of Total Habitat</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("noNetZonesData",c,p,1),c,p,0,1901,1991,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HabType",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Percent",c,p,0)));_.b(" %</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <p>");_.b("\n" + i);_.b("    Percentages shown represent the proportion of habitats available in ");_.b("\n" + i);_.b("    Barbuda's entire 3 nautical mile boundary captured within no net zones.");_.b("\n" + i);_.b("  </p> -->");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Marxan Analysis</h4>");_.b("\n" + i);_.b("  <select class=\"chosen\" width=\"400px\">");_.b("\n" + i);if(_.s(_.f("marxanAnalyses",c,p,1),c,p,0,2350,2405,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <option value=\"");_.b(_.v(_.d(".",c,p,0)));_.b("\">Scenario ");_.b(_.v(_.d(".",c,p,0)));_.b("</option>");_.b("\n");});c.pop();}_.b("  </select>");_.b("\n" + i);_.b("  <p class=\"scenarioResults\"></p>");_.b("\n" + i);_.b("  <div class=\"viz\"></div>");_.b("\n" + i);_.b("  <p class=\"scenarioDescription\"></p>");_.b("\n" + i);_.b("</div>");return _.fl();;});
this["Templates"]["arrayOverview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<div class=\"reportSection size\">");_.b("\n" + i);_.b("  <h4>Size</h4>");_.b("\n" + i);if(_.s(_.f("hasSketches",c,p,1),c,p,0,363,874,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p class=\"large\">");_.b("\n" + i);_.b("    This collection is composed of <strong>");_.b(_.v(_.f("numSketches",c,p,0)));_.b(" zone");if(_.s(_.f("sketchesPlural",c,p,1),c,p,0,468,469,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</strong> in both ocean and lagoon waters. The collection includes a total <em>oceanic</em> area of <strong>");_.b(_.v(_.f("sumOceanArea",c,p,0)));_.b(" square miles</strong>, which represents <strong>");_.b(_.v(_.f("sumOceanPercent",c,p,0)));_.b("%</strong> of Barbuda's waters. It also incorporates ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("sumLagoonArea",c,p,0)));_.b(" square miles</strong>, or <strong>");_.b(_.v(_.f("sumLagoonPercent",c,p,0)));_.b("%</strong>, of the total <em>lagoon area</em>.");_.b("\n" + i);_.b("  </p>");_.b("\n");});c.pop();}if(_.s(_.f("hasSanctuaries",c,p,1),c,p,0,914,1653,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p class=\"large\">");_.b("\n" + i);_.b("    The collection includes <strong>");_.b(_.v(_.f("numSanctuaries",c,p,0)));_.b(" ");if(!_.s(_.f("sanctuariesPlural",c,p,1),c,p,1,0,0,"")){_.b("sanctuary");};if(_.s(_.f("sanctuariesPlural",c,p,1),c,p,0,1067,1078,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("sanctuaries");});c.pop();}_.b("</strong> in both ocean and lagoon waters. The ");if(!_.s(_.f("sanctuariesPlural",c,p,1),c,p,1,0,0,"")){_.b("sanctuary");};if(_.s(_.f("sanctuariesPlural",c,p,1),c,p,0,1222,1233,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("sanctuaries");});c.pop();}_.b(" contain");if(!_.s(_.f("sanctuariesPlural",c,p,1),c,p,1,0,0,"")){_.b("s");};_.b(" a total <em>oceanic</em> area of <strong>");_.b(_.v(_.f("sanctuaryOceanArea",c,p,0)));_.b(" square miles</strong>, ");_.b("\n" + i);_.b("    which represents <strong>");_.b(_.v(_.f("sanctuaryOceanPercent",c,p,0)));_.b("%</strong> of Barbuda's waters. It also includes ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("sanctuaryLagoonArea",c,p,0)));_.b(" square miles</strong>, or <strong>");_.b(_.v(_.f("sanctuaryLagoonPercent",c,p,0)));_.b("%</strong>, of the total <em>lagoon area</em>.");_.b("\n" + i);_.b("  </p>");_.b("\n");});c.pop();}if(_.s(_.f("hasNoNetZones",c,p,1),c,p,0,1693,2329,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p class=\"large\">");_.b("\n" + i);_.b("    The collection includes <strong>");_.b(_.v(_.f("numNoNetZones",c,p,0)));_.b(" No Net Zone");if(_.s(_.f("noNetZonesPlural",c,p,1),c,p,0,1802,1803,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</strong> in both ocean and lagoon waters. The No Net Zone");if(_.s(_.f("noNetZonesPlural",c,p,1),c,p,0,1903,1904,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</strong> contain");if(!_.s(_.f("noNetZonesPlural",c,p,1),c,p,1,0,0,"")){_.b("s");};_.b(" a total <em>oceanic</em> area of <strong>");_.b(_.v(_.f("noNetZonesOceanArea",c,p,0)));_.b(" square miles</strong>, which represents <strong>");_.b(_.v(_.f("noNetZonesOceanPercent",c,p,0)));_.b("%</strong> of Barbuda's waters. It also includes ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("noNetZonesLagoonArea",c,p,0)));_.b(" square miles</strong>, or <strong>");_.b(_.v(_.f("noNetZonesLagoonPercent",c,p,0)));_.b("%</strong>, of the total <em>lagoon area</em>.");_.b("\n" + i);_.b("  </p>");_.b("\n");});c.pop();}if(_.s(_.f("hasMoorings",c,p,1),c,p,0,2366,2978,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p class=\"large\">");_.b("\n" + i);_.b("    The collection includes <strong>");_.b(_.v(_.f("numMoorings",c,p,0)));_.b(" Mooring Area");if(_.s(_.f("mooringsPlural",c,p,1),c,p,0,2472,2473,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</strong> in both ocean and lagoon waters. The Mooring Area");if(_.s(_.f("mooringsPlural",c,p,1),c,p,0,2570,2571,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b(" contain");if(!_.s(_.f("mooringsPlural",c,p,1),c,p,1,0,0,"")){_.b("s");};_.b(" a total <em>oceanic</em> area of <strong>");_.b(_.v(_.f("mooringsOceanArea",c,p,0)));_.b(" square miles</strong>, ");_.b("\n" + i);_.b("    which represents <strong>");_.b(_.v(_.f("mooringsOceanPercent",c,p,0)));_.b("%</strong> of Barbuda's waters. It also includes ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("mooringsLagoonArea",c,p,0)));_.b(" square miles</strong>, or <strong>");_.b(_.v(_.f("mooringsLagoonPercent",c,p,0)));_.b("%</strong>, of the total <em>lagoon area</em>.");_.b("\n" + i);_.b("  </p>");_.b("\n");});c.pop();}if(_.s(_.f("hasAquaculture",c,p,1),c,p,0,3016,3664,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p class=\"large\">");_.b("\n" + i);_.b("    The collection includes <strong>");_.b(_.v(_.f("numAquaculture",c,p,0)));_.b(" Aquaculture Area");if(_.s(_.f("aquaculturePlural",c,p,1),c,p,0,3132,3133,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</strong> in both ocean and lagoon waters. The Aquaculture Area");if(_.s(_.f("aquaculturePlural",c,p,1),c,p,0,3240,3241,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b(" contain");if(!_.s(_.f("aquaculturePlural",c,p,1),c,p,1,0,0,"")){_.b("s");};_.b(" a total <em>oceanic</em> area of <strong>");_.b(_.v(_.f("aquacultureOceanArea",c,p,0)));_.b(" square miles</strong>, which represents <strong>");_.b(_.v(_.f("aquacultureOceanPercent",c,p,0)));_.b("%</strong> of Barbuda's waters. It also includes ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("aquacultureLagoonArea",c,p,0)));_.b(" square miles</strong>, or <strong>");_.b(_.v(_.f("aquacultureLagoonPercent",c,p,0)));_.b("%</strong>, of the total <em>lagoon area</em>.");_.b("\n" + i);_.b("  </p>");_.b("\n");});c.pop();}if(_.s(_.f("hasFishingAreas",c,p,1),c,p,0,3706,4375,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p class=\"large\">");_.b("\n" + i);_.b("    The collection includes <strong>");_.b(_.v(_.f("numFishingAreas",c,p,0)));_.b(" Fishing Priority Area");if(_.s(_.f("fishingAreasPlural",c,p,1),c,p,0,3829,3830,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</strong> in both ocean and lagoon waters. The Fishing Priority Area");if(_.s(_.f("fishingAreasPlural",c,p,1),c,p,0,3944,3945,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b(" contain");if(!_.s(_.f("fishingAreasPlural",c,p,1),c,p,1,0,0,"")){_.b("s");};_.b(" a total <em>oceanic</em> area of <strong>");_.b(_.v(_.f("fishingAreasOceanArea",c,p,0)));_.b(" square miles</strong>, which represents <strong>");_.b(_.v(_.f("fishingAreasOceanPercent",c,p,0)));_.b("%</strong> of Barbuda's waters. It also includes ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("fishingAreasLagoonArea",c,p,0)));_.b(" square miles</strong>, or <strong>");_.b(_.v(_.f("fishingAreasLagoonPercent",c,p,0)));_.b("%</strong>, of the total <em>lagoon area</em>.");_.b("\n" + i);_.b("  </p>");_.b("\n");});c.pop();}_.b("</div>");_.b("\n" + i);_.b("<!--");_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Zones in this Proposal</h4>");_.b("\n" + i);_.b("  <div class=\"tocContainer\"></div>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("-->");_.b("\n" + i);if(_.s(_.f("anyAttributes",c,p,1),c,p,0,4534,4658,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" Attributes</h4>");_.b("\n" + i);_.b(_.rp("attributes/attributesTable",c,p,"  "));_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}return _.fl();;});
this["Templates"]["arrayTradeoffs"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Tradeoffs</h4>");_.b("\n" + i);_.b("  	<p class=\"large\" style=\"margin-left:15px;\">");_.b("\n" + i);_.b("  		<a href = \"http://mcclintock.msi.ucsb.edu/blog/tradeoff-analyses-in-seasketch\" target=\"_blank\">Tradeoff Analysis</a> examines the impact of lobster and conch fishing on relative ecological and fishing values. Preventing fishing in an area generally");_.b("\n" + i);_.b("  		increases the ecological score by reducing impacts and decreases fishing values by reducing fishing take. Stopping fishing in some areas, such as nursery grounds, can");_.b("\n" + i);_.b("  		increase both scores by reducing ecological impacts and increasing fish stocks. ");_.b("\n" + i);_.b("  	</p>");_.b("\n" + i);_.b("	<p class=\"small ttip-tip\">");_.b("\n" + i);_.b("	   Tip: hover over a proposal to see details");_.b("\n" + i);_.b("	</p>");_.b("\n" + i);_.b("  	<div  id=\"tradeoff-chart\" class=\"tradeoff-chart\"></div>");_.b("\n" + i);_.b("</div>");return _.fl();;});
this["Templates"]["demo"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Report Sections</h4>");_.b("\n" + i);_.b("  <p>Use report sections to group information into meaningful categories</p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>D3 Visualizations</h4>");_.b("\n" + i);_.b("  <ul class=\"nav nav-pills\" id=\"tabs2\">");_.b("\n" + i);_.b("    <li class=\"active\"><a href=\"#chart\">Chart</a></li>");_.b("\n" + i);_.b("    <li><a href=\"#dataTable\">Table</a></li>");_.b("\n" + i);_.b("  </ul>");_.b("\n" + i);_.b("  <div class=\"tab-content\">");_.b("\n" + i);_.b("    <div class=\"tab-pane active\" id=\"chart\">");_.b("\n" + i);_.b("      <!--[if IE 8]>");_.b("\n" + i);_.b("      <p class=\"unsupported\">");_.b("\n" + i);_.b("      This visualization is not compatible with Internet Explorer 8. ");_.b("\n" + i);_.b("      Please upgrade your browser, or view results in the table tab.");_.b("\n" + i);_.b("      </p>      ");_.b("\n" + i);_.b("      <![endif]-->");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        See <code>src/scripts/demo.coffee</code> for an example of how to ");_.b("\n" + i);_.b("        use d3.js to render visualizations. Provide a table-based view");_.b("\n" + i);_.b("        and use conditional comments to provide a fallback for IE8 users.");_.b("\n" + i);_.b("        <br>");_.b("\n" + i);_.b("        <a href=\"http://twitter.github.io/bootstrap/2.3.2/\">Bootstrap 2.x</a>");_.b("\n" + i);_.b("        is loaded within SeaSketch so you can use it to create tabs and other ");_.b("\n" + i);_.b("        interface components. jQuery and underscore are also available.");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("    </div>");_.b("\n" + i);_.b("    <div class=\"tab-pane\" id=\"dataTable\">");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>index</th>");_.b("\n" + i);_.b("            <th>value</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("chartData",c,p,1),c,p,0,1351,1418,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr><td>");_.b(_.v(_.f("index",c,p,0)));_.b("</td><td>");_.b(_.v(_.f("value",c,p,0)));_.b("</td></tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("    </div>");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection emphasis\">");_.b("\n" + i);_.b("  <h4>Emphasis</h4>");_.b("\n" + i);_.b("  <p>Give report sections an <code>emphasis</code> class to highlight important information.</p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection warning\">");_.b("\n" + i);_.b("  <h4>Warning</h4>");_.b("\n" + i);_.b("  <p>Or <code>warn</code> of potential problems.</p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection danger\">");_.b("\n" + i);_.b("  <h4>Danger</h4>");_.b("\n" + i);_.b("  <p><code>danger</code> can also be used... sparingly.</p>");_.b("\n" + i);_.b("</div>");return _.fl();;});
this["Templates"]["fishingPriorityArea"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Fishing Value</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This fishing priority area includes <strong>");_.b(_.v(_.f("percent",c,p,0)));_.b("%</strong> of the ");_.b("\n" + i);_.b("    fishing value within Barbuda's waters, based on user reported values of ");_.b("\n" + i);_.b("    fishing grounds");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <a href=\"#\" data-toggle-node=\"533f16f6a498867c56c6fb57\">show fishing values layer</a>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});
this["Templates"]["fishingValue"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Fishing Value</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This <strong>");_.b(_.v(_.f("areaLabel",c,p,0)));_.b("</strong> ");if(_.s(_.f("isMooringArea",c,p,1),c,p,0,131,154,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("may or may not displace");});c.pop();}_.b(" ");if(!_.s(_.f("isMooringArea",c,p,1),c,p,1,0,0,"")){_.b("displaces");};_.b(" <strong>");_.b(_.v(_.f("percent",c,p,0)));_.b("%</strong> ");_.b("\n" + i);_.b("    of the fishing value within Barbuda’s waters, based on user reported");_.b("\n" + i);_.b("    values of fishing grounds.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <a href=\"#\" data-toggle-node=\"533f16f6a498867c56c6fb57\">show fishing values layer</a>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});
this["Templates"]["habitat"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>");_.b(_.v(_.f("heading",c,p,0)));_.b("</h4>");_.b("\n" + i);_.b("  <table>");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Habitat</th>");_.b("\n" + i);_.b("        <th>% of Total Habitat</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("habitats",c,p,1),c,p,0,216,279,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr><td>");_.b(_.v(_.f("HabType",c,p,0)));_.b("</td><td>");_.b(_.v(_.f("Percent",c,p,0)));_.b("</td></tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    Percentages shown represent the proportion of habitats available in ");_.b("\n" + i);_.b("    Barbuda's entire 3 nautical mile boundary captured within this zone. <br>");_.b("\n" + i);_.b("    <a href=\"#\" data-toggle-node=\"533ddf86a498867c56c6c830\">show habitats layer</a>");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Marxan Analysis</h4>");_.b("\n" + i);_.b("  <select class=\"chosen\" width=\"400px\">");_.b("\n" + i);if(_.s(_.f("marxanAnalyses",c,p,1),c,p,0,690,745,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <option value=\"");_.b(_.v(_.d(".",c,p,0)));_.b("\">Scenario ");_.b(_.v(_.d(".",c,p,0)));_.b("</option>");_.b("\n");});c.pop();}_.b("  </select>");_.b("\n" + i);_.b("  <p class=\"scenarioResults\"></p>");_.b("\n" + i);_.b("  <div class=\"viz\"></div>");_.b("\n" + i);_.b("  <p class=\"scenarioDescription\"></p>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});
this["Templates"]["overview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<div class=\"reportSection size\">");_.b("\n" + i);_.b("  <h4>Size</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This area is <strong>");_.b(_.v(_.f("SQ_MILES",c,p,0)));_.b(" square miles</strong>,");_.b("\n" + i);_.b("    which represents <strong>");_.b(_.v(_.f("PERCENT",c,p,0)));_.b("%</strong> of Barbuda's waters.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);if(_.s(_.f("renderMinimumWidth",c,p,1),c,p,0,536,1178,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection diameter ");if(!_.s(_.f("DIAM_OK",c,p,1),c,p,1,0,0,"")){_.b("warning");};_.b("\">");_.b("\n" + i);_.b("  <h4>Minimum Width</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    The minimum width of a zone significantly impacts  its conservation value. ");_.b("\n" + i);_.b("    The recommended smallest diameter is between 2 and 3 miles.");_.b("\n" + i);_.b("    <strong>");_.b("\n" + i);if(!_.s(_.f("DIAM_OK",c,p,1),c,p,1,0,0,"")){_.b("    This design falls outside the recommendation at ");_.b(_.v(_.f("DIAM",c,p,0)));_.b(" miles.");_.b("\n");};if(_.s(_.f("DIAM_OK",c,p,1),c,p,0,926,997,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    This design fits within the recommendation at ");_.b(_.v(_.f("DIAM",c,p,0)));_.b(" miles.");_.b("\n");});c.pop();}_.b("    </strong>");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <div class=\"viz\" style=\"position:relative;\"></div>");_.b("\n" + i);_.b("  <img src=\"http://s3.amazonaws.com/SeaSketch/projects/barbuda/min_width_example.png\">");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);if(_.s(_.f("anyAttributes",c,p,1),c,p,0,1221,1345,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" Attributes</h4>");_.b("\n" + i);_.b(_.rp("attributes/attributesTable",c,p,"  "));_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}return _.fl();;});

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = this["Templates"];
}
},{}]},{},[11])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL3RyYWluaW5nLXJlcG9ydHMtdjIvbm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvdHJhaW5pbmctcmVwb3J0cy12Mi9ub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9saWIvX2VtcHR5LmpzIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL2VuYWJsZUxheWVyVG9nZ2xlcnMuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL2pvYkl0ZW0uY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL3JlcG9ydFJlc3VsdHMuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL3JlcG9ydFRhYi5jb2ZmZWUiLCIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL3RyYWluaW5nLXJlcG9ydHMtdjIvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvdXRpbHMuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL3NjcmlwdHMvZmlzaFNhbmN0dWFyeS5jb2ZmZWUiLCIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL3RyYWluaW5nLXJlcG9ydHMtdjIvc2NyaXB0cy9maXNoaW5nVmFsdWUuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL3NjcmlwdHMvaGFiaXRhdFRhYi5jb2ZmZWUiLCIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL3RyYWluaW5nLXJlcG9ydHMtdjIvc2NyaXB0cy9pZHMuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL3NjcmlwdHMvb3ZlcnZpZXdUYWIuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTs7QUNBQSxDQUFPLENBQVUsQ0FBQSxHQUFYLENBQU4sRUFBa0I7Q0FDaEIsS0FBQSwyRUFBQTtDQUFBLENBQUEsQ0FBQTtDQUFBLENBQ0EsQ0FBQSxHQUFZO0NBRFosQ0FFQSxDQUFBLEdBQU07QUFDQyxDQUFQLENBQUEsQ0FBQSxDQUFBO0NBQ0UsRUFBQSxDQUFBLEdBQU8scUJBQVA7Q0FDQSxTQUFBO0lBTEY7Q0FBQSxDQU1BLENBQVcsQ0FBQSxJQUFYLGFBQVc7Q0FFWDtDQUFBLE1BQUEsb0NBQUE7d0JBQUE7Q0FDRSxFQUFXLENBQVgsR0FBVyxDQUFYO0NBQUEsRUFDUyxDQUFULEVB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RUFBRCxJQUFDLENBQVosT0FBQTtDQUp4QixFQU1VLENBTlYsRUFBQSxDQUlpQixFQUVOO0NBQU0sRUFBSyxDQUFGLENBQUEsR0FBSDtDQUFrQyxnQkFBRDtNQUFqQyxJQUFBO0NBQUEsZ0JBQTZDO1VBQXBEO0NBTlYsRUFRWSxDQVJaLEVBQUEsQ0FNVSxFQUVHO0NBQ0wsR0FBRyxDQUFXLEVBQVYsQ0FBSjtDQUNPLEVBQUQsQ0FBSCxDQUFBLFlBQUE7TUFESCxJQUFBO0NBR0ssQ0FBSCxDQUFFLEVBQUYsWUFBQTtVQUpFO0NBUlosTUFRWTtDQU1OLENBR1csQ0FDQSxDQUpqQixDQUFLLENBQUwsQ0FBQSxFQUFBLENBQUEsR0FBQTtDQUl3QixFQUFPLFlBQVA7Q0FKeEIsRUFLUSxDQUxSLEdBSWlCLEVBQ1I7Q0FBRCxjQUFPO0NBTGYsTUFLUTtNQW5ESDtDQXpDVCxFQXlDUzs7Q0F6Q1Q7O0NBRHdCOztBQWdHMUIsQ0FsSEEsRUFrSGlCLEdBQVgsQ0FBTixJQWxIQTs7OztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIixudWxsLCJtb2R1bGUuZXhwb3J0cyA9IChlbCkgLT5cbiAgJGVsID0gJCBlbFxuICBhcHAgPSB3aW5kb3cuYXBwXG4gIHRvYyA9IGFwcC5nZXRUb2MoKVxuICB1bmxlc3MgdG9jXG4gICAgY29uc29sZS5sb2cgJ05vIHRhYmxlIG9mIGNvbnRlbnRzIGZvdW5kJ1xuICAgIHJldHVyblxuICB0b2dnbGVycyA9ICRlbC5maW5kKCdhW2RhdGEtdG9nZ2xlLW5vZGVdJylcbiAgIyBTZXQgaW5pdGlhbCBzdGF0ZVxuICBmb3IgdG9nZ2xlciBpbiB0b2dnbGVycy50b0FycmF5KClcbiAgICAkdG9nZ2xlciA9ICQodG9nZ2xlcilcbiAgICBub2RlaWQgPSAkdG9nZ2xlci5kYXRhKCd0b2dnbGUtbm9kZScpXG4gICAgdHJ5XG4gICAgICB2aWV3ID0gdG9jLmdldENoaWxkVmlld0J5SWQgbm9kZWlkXG4gICAgICBub2RlID0gdmlldy5tb2RlbFxuICAgICAgJHRvZ2dsZXIuYXR0ciAnZGF0YS12aXNpYmxlJywgISFub2RlLmdldCgndmlzaWJsZScpXG4gICAgICAkdG9nZ2xlci5kYXRhICd0b2NJdGVtJywgdmlld1xuICAgIGNhdGNoIGVcbiAgICAgICR0b2dnbGVyLmF0dHIgJ2RhdGEtbm90LWZvdW5kJywgJ3RydWUnXG5cbiAgdG9nZ2xlcnMub24gJ2NsaWNrJywgKGUpIC0+XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgJGVsID0gJChlLnRhcmdldClcbiAgICB2aWV3ID0gJGVsLmRhdGEoJ3RvY0l0ZW0nKVxuICAgIGlmIHZpZXdcbiAgICAgIHZpZXcudG9nZ2xlVmlzaWJpbGl0eShlKVxuICAgICAgJGVsLmF0dHIgJ2RhdGEtdmlzaWJsZScsICEhdmlldy5tb2RlbC5nZXQoJ3Zpc2libGUnKVxuICAgIGVsc2VcbiAgICAgIGFsZXJ0IFwiTGF5ZXIgbm90IGZvdW5kIGluIHRoZSBjdXJyZW50IFRhYmxlIG9mIENvbnRlbnRzLiBcXG5FeHBlY3RlZCBub2RlaWQgI3skZWwuZGF0YSgndG9nZ2xlLW5vZGUnKX1cIlxuIiwiY2xhc3MgSm9iSXRlbSBleHRlbmRzIEJhY2tib25lLlZpZXdcbiAgY2xhc3NOYW1lOiAncmVwb3J0UmVzdWx0J1xuICBldmVudHM6IHt9XG4gIGJpbmRpbmdzOlxuICAgIFwiaDYgYVwiOlxuICAgICAgb2JzZXJ2ZTogXCJzZXJ2aWNlTmFtZVwiXG4gICAgICB1cGRhdGVWaWV3OiB0cnVlXG4gICAgICBhdHRyaWJ1dGVzOiBbe1xuICAgICAgICBuYW1lOiAnaHJlZidcbiAgICAgICAgb2JzZXJ2ZTogJ3NlcnZpY2VVcmwnXG4gICAgICB9XVxuICAgIFwiLnN0YXJ0ZWRBdFwiOlxuICAgICAgb2JzZXJ2ZTogW1wic3RhcnRlZEF0XCIsIFwic3RhdHVzXCJdXG4gICAgICB2aXNpYmxlOiAoKSAtPlxuICAgICAgICBAbW9kZWwuZ2V0KCdzdGF0dXMnKSBub3QgaW4gWydjb21wbGV0ZScsICdlcnJvciddXG4gICAgICB1cGRhdGVWaWV3OiB0cnVlXG4gICAgICBvbkdldDogKCkgLT5cbiAgICAgICAgaWYgQG1vZGVsLmdldCgnc3RhcnRlZEF0JylcbiAgICAgICAgICByZXR1cm4gXCJTdGFydGVkIFwiICsgbW9tZW50KEBtb2RlbC5nZXQoJ3N0YXJ0ZWRBdCcpKS5mcm9tTm93KCkgKyBcIi4gXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgIFwiXCJcbiAgICBcIi5zdGF0dXNcIjogICAgICBcbiAgICAgIG9ic2VydmU6IFwic3RhdHVzXCJcbiAgICAgIG9uR2V0OiAocykgLT5cbiAgICAgICAgc3dpdGNoIHNcbiAgICAgICAgICB3aGVuICdwZW5kaW5nJ1xuICAgICAgICAgICAgXCJ3YWl0aW5nIGluIGxpbmVcIlxuICAgICAgICAgIHdoZW4gJ3J1bm5pbmcnXG4gICAgICAgICAgICBcInJ1bm5pbmcgYW5hbHl0aWNhbCBzZXJ2aWNlXCJcbiAgICAgICAgICB3aGVuICdjb21wbGV0ZSdcbiAgICAgICAgICAgIFwiY29tcGxldGVkXCJcbiAgICAgICAgICB3aGVuICdlcnJvcidcbiAgICAgICAgICAgIFwiYW4gZXJyb3Igb2NjdXJyZWRcIlxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHNcbiAgICBcIi5xdWV1ZUxlbmd0aFwiOiBcbiAgICAgIG9ic2VydmU6IFwicXVldWVMZW5ndGhcIlxuICAgICAgb25HZXQ6ICh2KSAtPlxuICAgICAgICBzID0gXCJXYWl0aW5nIGJlaGluZCAje3Z9IGpvYlwiXG4gICAgICAgIGlmIHYubGVuZ3RoID4gMVxuICAgICAgICAgIHMgKz0gJ3MnXG4gICAgICAgIHJldHVybiBzICsgXCIuIFwiXG4gICAgICB2aXNpYmxlOiAodikgLT5cbiAgICAgICAgdj8gYW5kIHBhcnNlSW50KHYpID4gMFxuICAgIFwiLmVycm9yc1wiOlxuICAgICAgb2JzZXJ2ZTogJ2Vycm9yJ1xuICAgICAgdXBkYXRlVmlldzogdHJ1ZVxuICAgICAgdmlzaWJsZTogKHYpIC0+XG4gICAgICAgIHY/Lmxlbmd0aCA+IDJcbiAgICAgIG9uR2V0OiAodikgLT5cbiAgICAgICAgaWYgdj9cbiAgICAgICAgICBKU09OLnN0cmluZ2lmeSh2LCBudWxsLCAnICAnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgbnVsbFxuXG4gIGNvbnN0cnVjdG9yOiAoQG1vZGVsKSAtPlxuICAgIHN1cGVyKClcblxuICByZW5kZXI6ICgpIC0+XG4gICAgQCRlbC5odG1sIFwiXCJcIlxuICAgICAgPGg2PjxhIGhyZWY9XCIjXCIgdGFyZ2V0PVwiX2JsYW5rXCI+PC9hPjxzcGFuIGNsYXNzPVwic3RhdHVzXCI+PC9zcGFuPjwvaDY+XG4gICAgICA8ZGl2PlxuICAgICAgICA8c3BhbiBjbGFzcz1cInN0YXJ0ZWRBdFwiPjwvc3Bhbj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJxdWV1ZUxlbmd0aFwiPjwvc3Bhbj5cbiAgICAgICAgPHByZSBjbGFzcz1cImVycm9yc1wiPjwvcHJlPlxuICAgICAgPC9kaXY+XG4gICAgXCJcIlwiXG4gICAgQHN0aWNraXQoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEpvYkl0ZW0iLCJjbGFzcyBSZXBvcnRSZXN1bHRzIGV4dGVuZHMgQmFja2JvbmUuQ29sbGVjdGlvblxuXG4gIGRlZmF1bHRQb2xsaW5nSW50ZXJ2YWw6IDMwMDBcblxuICBjb25zdHJ1Y3RvcjogKEBza2V0Y2gsIEBkZXBzKSAtPlxuICAgIEB1cmwgPSB1cmwgPSBcIi9yZXBvcnRzLyN7QHNrZXRjaC5pZH0vI3tAZGVwcy5qb2luKCcsJyl9XCJcbiAgICBzdXBlcigpXG5cbiAgcG9sbDogKCkgPT5cbiAgICBAZmV0Y2gge1xuICAgICAgc3VjY2VzczogKCkgPT5cbiAgICAgICAgQHRyaWdnZXIgJ2pvYnMnXG4gICAgICAgIGZvciByZXN1bHQgaW4gQG1vZGVsc1xuICAgICAgICAgIGlmIHJlc3VsdC5nZXQoJ3N0YXR1cycpIG5vdCBpbiBbJ2NvbXBsZXRlJywgJ2Vycm9yJ11cbiAgICAgICAgICAgIHVubGVzcyBAaW50ZXJ2YWxcbiAgICAgICAgICAgICAgQGludGVydmFsID0gc2V0SW50ZXJ2YWwgQHBvbGwsIEBkZWZhdWx0UG9sbGluZ0ludGVydmFsXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgIyBhbGwgY29tcGxldGUgdGhlblxuICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChAaW50ZXJ2YWwpIGlmIEBpbnRlcnZhbFxuICAgICAgICBpZiBwcm9ibGVtID0gXy5maW5kKEBtb2RlbHMsIChyKSAtPiByLmdldCgnZXJyb3InKT8pXG4gICAgICAgICAgQHRyaWdnZXIgJ2Vycm9yJywgXCJQcm9ibGVtIHdpdGggI3twcm9ibGVtLmdldCgnc2VydmljZU5hbWUnKX0gam9iXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEB0cmlnZ2VyICdmaW5pc2hlZCdcbiAgICAgIGVycm9yOiAoZSwgcmVzLCBhLCBiKSA9PlxuICAgICAgICB1bmxlc3MgcmVzLnN0YXR1cyBpcyAwXG4gICAgICAgICAgaWYgcmVzLnJlc3BvbnNlVGV4dD8ubGVuZ3RoXG4gICAgICAgICAgICB0cnlcbiAgICAgICAgICAgICAganNvbiA9IEpTT04ucGFyc2UocmVzLnJlc3BvbnNlVGV4dClcbiAgICAgICAgICAgIGNhdGNoXG4gICAgICAgICAgICAgICMgZG8gbm90aGluZ1xuICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKEBpbnRlcnZhbCkgaWYgQGludGVydmFsXG4gICAgICAgICAgQHRyaWdnZXIgJ2Vycm9yJywganNvbj8uZXJyb3I/Lm1lc3NhZ2Ugb3IgXG4gICAgICAgICAgICAnUHJvYmxlbSBjb250YWN0aW5nIHRoZSBTZWFTa2V0Y2ggc2VydmVyJ1xuICAgIH1cblxubW9kdWxlLmV4cG9ydHMgPSBSZXBvcnRSZXN1bHRzXG4iLCJlbmFibGVMYXllclRvZ2dsZXJzID0gcmVxdWlyZSAnLi9lbmFibGVMYXllclRvZ2dsZXJzLmNvZmZlZSdcbnJvdW5kID0gcmVxdWlyZSgnLi91dGlscy5jb2ZmZWUnKS5yb3VuZFxuUmVwb3J0UmVzdWx0cyA9IHJlcXVpcmUgJy4vcmVwb3J0UmVzdWx0cy5jb2ZmZWUnXG50ID0gcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcycpXG50ZW1wbGF0ZXMgPVxuICByZXBvcnRMb2FkaW5nOiB0Wydub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvcmVwb3J0TG9hZGluZyddXG5Kb2JJdGVtID0gcmVxdWlyZSAnLi9qb2JJdGVtLmNvZmZlZSdcbkNvbGxlY3Rpb25WaWV3ID0gcmVxdWlyZSgndmlld3MvY29sbGVjdGlvblZpZXcnKVxuXG5jbGFzcyBSZWNvcmRTZXRcblxuICBjb25zdHJ1Y3RvcjogKEBkYXRhLCBAdGFiLCBAc2tldGNoQ2xhc3NJZCkgLT5cblxuICB0b0FycmF5OiAoKSAtPlxuICAgIGlmIEBza2V0Y2hDbGFzc0lkXG4gICAgICBkYXRhID0gXy5maW5kIEBkYXRhLnZhbHVlLCAodikgPT5cbiAgICAgICAgdi5mZWF0dXJlcz9bMF0/LmF0dHJpYnV0ZXM/WydTQ19JRCddIGlzIEBza2V0Y2hDbGFzc0lkXG4gICAgICB1bmxlc3MgZGF0YVxuICAgICAgICB0aHJvdyBcIkNvdWxkIG5vdCBmaW5kIGRhdGEgZm9yIHNrZXRjaENsYXNzICN7QHNrZXRjaENsYXNzSWR9XCJcbiAgICBlbHNlXG4gICAgICBpZiBfLmlzQXJyYXkgQGRhdGEudmFsdWVcbiAgICAgICAgZGF0YSA9IEBkYXRhLnZhbHVlWzBdXG4gICAgICBlbHNlXG4gICAgICAgIGRhdGEgPSBAZGF0YS52YWx1ZVxuICAgIF8ubWFwIGRhdGEuZmVhdHVyZXMsIChmZWF0dXJlKSAtPlxuICAgICAgZmVhdHVyZS5hdHRyaWJ1dGVzXG5cbiAgcmF3OiAoYXR0cikgLT5cbiAgICBhdHRycyA9IF8ubWFwIEB0b0FycmF5KCksIChyb3cpIC0+XG4gICAgICByb3dbYXR0cl1cbiAgICBhdHRycyA9IF8uZmlsdGVyIGF0dHJzLCAoYXR0cikgLT4gYXR0ciAhPSB1bmRlZmluZWRcbiAgICBpZiBhdHRycy5sZW5ndGggaXMgMFxuICAgICAgY29uc29sZS5sb2cgQGRhdGFcbiAgICAgIEB0YWIucmVwb3J0RXJyb3IgXCJDb3VsZCBub3QgZ2V0IGF0dHJpYnV0ZSAje2F0dHJ9IGZyb20gcmVzdWx0c1wiXG4gICAgICB0aHJvdyBcIkNvdWxkIG5vdCBnZXQgYXR0cmlidXRlICN7YXR0cn1cIlxuICAgIGVsc2UgaWYgYXR0cnMubGVuZ3RoIGlzIDFcbiAgICAgIHJldHVybiBhdHRyc1swXVxuICAgIGVsc2VcbiAgICAgIHJldHVybiBhdHRyc1xuXG4gIGludDogKGF0dHIpIC0+XG4gICAgcmF3ID0gQHJhdyhhdHRyKVxuICAgIGlmIF8uaXNBcnJheShyYXcpXG4gICAgICBfLm1hcCByYXcsIHBhcnNlSW50XG4gICAgZWxzZVxuICAgICAgcGFyc2VJbnQocmF3KVxuXG4gIGZsb2F0OiAoYXR0ciwgZGVjaW1hbFBsYWNlcz0yKSAtPlxuICAgIHJhdyA9IEByYXcoYXR0cilcbiAgICBpZiBfLmlzQXJyYXkocmF3KVxuICAgICAgXy5tYXAgcmF3LCAodmFsKSAtPiByb3VuZCh2YWwsIGRlY2ltYWxQbGFjZXMpXG4gICAgZWxzZVxuICAgICAgcm91bmQocmF3LCBkZWNpbWFsUGxhY2VzKVxuXG4gIGJvb2w6IChhdHRyKSAtPlxuICAgIHJhdyA9IEByYXcoYXR0cilcbiAgICBpZiBfLmlzQXJyYXkocmF3KVxuICAgICAgXy5tYXAgcmF3LCAodmFsKSAtPiB2YWwudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpIGlzICd0cnVlJ1xuICAgIGVsc2VcbiAgICAgIHJhdy50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkgaXMgJ3RydWUnXG5cbmNsYXNzIFJlcG9ydFRhYiBleHRlbmRzIEJhY2tib25lLlZpZXdcbiAgbmFtZTogJ0luZm9ybWF0aW9uJ1xuICBkZXBlbmRlbmNpZXM6IFtdXG5cbiAgaW5pdGlhbGl6ZTogKEBtb2RlbCwgQG9wdGlvbnMpIC0+XG4gICAgIyBXaWxsIGJlIGluaXRpYWxpemVkIGJ5IFNlYVNrZXRjaCB3aXRoIHRoZSBmb2xsb3dpbmcgYXJndW1lbnRzOlxuICAgICMgICAqIG1vZGVsIC0gVGhlIHNrZXRjaCBiZWluZyByZXBvcnRlZCBvblxuICAgICMgICAqIG9wdGlvbnNcbiAgICAjICAgICAtIC5wYXJlbnQgLSB0aGUgcGFyZW50IHJlcG9ydCB2aWV3XG4gICAgIyAgICAgICAgY2FsbCBAb3B0aW9ucy5wYXJlbnQuZGVzdHJveSgpIHRvIGNsb3NlIHRoZSB3aG9sZSByZXBvcnQgd2luZG93XG4gICAgQGFwcCA9IHdpbmRvdy5hcHBcbiAgICBfLmV4dGVuZCBALCBAb3B0aW9uc1xuICAgIEByZXBvcnRSZXN1bHRzID0gbmV3IFJlcG9ydFJlc3VsdHMoQG1vZGVsLCBAZGVwZW5kZW5jaWVzKVxuICAgIEBsaXN0ZW5Ub09uY2UgQHJlcG9ydFJlc3VsdHMsICdlcnJvcicsIEByZXBvcnRFcnJvclxuICAgIEBsaXN0ZW5Ub09uY2UgQHJlcG9ydFJlc3VsdHMsICdqb2JzJywgQHJlbmRlckpvYkRldGFpbHNcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAnam9icycsIEByZXBvcnRKb2JzXG4gICAgQGxpc3RlblRvIEByZXBvcnRSZXN1bHRzLCAnZmluaXNoZWQnLCBfLmJpbmQgQHJlbmRlciwgQFxuICAgIEBsaXN0ZW5Ub09uY2UgQHJlcG9ydFJlc3VsdHMsICdyZXF1ZXN0JywgQHJlcG9ydFJlcXVlc3RlZFxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICB0aHJvdyAncmVuZGVyIG1ldGhvZCBtdXN0IGJlIG92ZXJpZGRlbidcblxuICBzaG93OiAoKSAtPlxuICAgIEAkZWwuc2hvdygpXG4gICAgQHZpc2libGUgPSB0cnVlXG4gICAgaWYgQGRlcGVuZGVuY2llcz8ubGVuZ3RoIGFuZCAhQHJlcG9ydFJlc3VsdHMubW9kZWxzLmxlbmd0aFxuICAgICAgQHJlcG9ydFJlc3VsdHMucG9sbCgpXG4gICAgZWxzZSBpZiAhQGRlcGVuZGVuY2llcz8ubGVuZ3RoXG4gICAgICBAcmVuZGVyKClcbiAgICAgIEAkKCdbZGF0YS1hdHRyaWJ1dGUtdHlwZT1VcmxGaWVsZF0gLnZhbHVlLCBbZGF0YS1hdHRyaWJ1dGUtdHlwZT1VcGxvYWRGaWVsZF0gLnZhbHVlJykuZWFjaCAoKSAtPlxuICAgICAgICB0ZXh0ID0gJChAKS50ZXh0KClcbiAgICAgICAgaHRtbCA9IFtdXG4gICAgICAgIGZvciB1cmwgaW4gdGV4dC5zcGxpdCgnLCcpXG4gICAgICAgICAgaWYgdXJsLmxlbmd0aFxuICAgICAgICAgICAgbmFtZSA9IF8ubGFzdCh1cmwuc3BsaXQoJy8nKSlcbiAgICAgICAgICAgIGh0bWwucHVzaCBcIlwiXCI8YSB0YXJnZXQ9XCJfYmxhbmtcIiBocmVmPVwiI3t1cmx9XCI+I3tuYW1lfTwvYT5cIlwiXCJcbiAgICAgICAgJChAKS5odG1sIGh0bWwuam9pbignLCAnKVxuXG5cbiAgaGlkZTogKCkgLT5cbiAgICBAJGVsLmhpZGUoKVxuICAgIEB2aXNpYmxlID0gZmFsc2VcblxuICByZW1vdmU6ICgpID0+XG4gICAgd2luZG93LmNsZWFySW50ZXJ2YWwgQGV0YUludGVydmFsXG4gICAgQHN0b3BMaXN0ZW5pbmcoKVxuICAgIHN1cGVyKClcblxuICByZXBvcnRSZXF1ZXN0ZWQ6ICgpID0+XG4gICAgQCRlbC5odG1sIHRlbXBsYXRlcy5yZXBvcnRMb2FkaW5nLnJlbmRlcih7fSlcblxuICByZXBvcnRFcnJvcjogKG1zZywgY2FuY2VsbGVkUmVxdWVzdCkgPT5cbiAgICB1bmxlc3MgY2FuY2VsbGVkUmVxdWVzdFxuICAgICAgaWYgbXNnIGlzICdKT0JfRVJST1InXG4gICAgICAgIEBzaG93RXJyb3IgJ0Vycm9yIHdpdGggc3BlY2lmaWMgam9iJ1xuICAgICAgZWxzZVxuICAgICAgICBAc2hvd0Vycm9yIG1zZ1xuXG4gIHNob3dFcnJvcjogKG1zZykgPT5cbiAgICBAJCgnLnByb2dyZXNzJykucmVtb3ZlKClcbiAgICBAJCgncC5lcnJvcicpLnJlbW92ZSgpXG4gICAgQCQoJ2g0JykudGV4dChcIkFuIEVycm9yIE9jY3VycmVkXCIpLmFmdGVyIFwiXCJcIlxuICAgICAgPHAgY2xhc3M9XCJlcnJvclwiIHN0eWxlPVwidGV4dC1hbGlnbjpjZW50ZXI7XCI+I3ttc2d9PC9wPlxuICAgIFwiXCJcIlxuXG4gIHJlcG9ydEpvYnM6ICgpID0+XG4gICAgdW5sZXNzIEBtYXhFdGFcbiAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLndpZHRoKCcxMDAlJylcbiAgICBAJCgnaDQnKS50ZXh0IFwiQW5hbHl6aW5nIERlc2lnbnNcIlxuXG4gIHN0YXJ0RXRhQ291bnRkb3duOiAoKSA9PlxuICAgIGlmIEBtYXhFdGFcbiAgICAgIHRvdGFsID0gKG5ldyBEYXRlKEBtYXhFdGEpLmdldFRpbWUoKSAtIG5ldyBEYXRlKEBldGFTdGFydCkuZ2V0VGltZSgpKSAvIDEwMDBcbiAgICAgIGxlZnQgPSAobmV3IERhdGUoQG1heEV0YSkuZ2V0VGltZSgpIC0gbmV3IERhdGUoKS5nZXRUaW1lKCkpIC8gMTAwMFxuICAgICAgXy5kZWxheSAoKSA9PlxuICAgICAgICBAcmVwb3J0UmVzdWx0cy5wb2xsKClcbiAgICAgICwgKGxlZnQgKyAxKSAqIDEwMDBcbiAgICAgIF8uZGVsYXkgKCkgPT5cbiAgICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykuY3NzICd0cmFuc2l0aW9uLXRpbWluZy1mdW5jdGlvbicsICdsaW5lYXInXG4gICAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLmNzcyAndHJhbnNpdGlvbi1kdXJhdGlvbicsIFwiI3tsZWZ0ICsgMX1zXCJcbiAgICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykud2lkdGgoJzEwMCUnKVxuICAgICAgLCA1MDBcblxuICByZW5kZXJKb2JEZXRhaWxzOiAoKSA9PlxuICAgIG1heEV0YSA9IG51bGxcbiAgICBmb3Igam9iIGluIEByZXBvcnRSZXN1bHRzLm1vZGVsc1xuICAgICAgaWYgam9iLmdldCgnZXRhJylcbiAgICAgICAgaWYgIW1heEV0YSBvciBqb2IuZ2V0KCdldGEnKSA+IG1heEV0YVxuICAgICAgICAgIG1heEV0YSA9IGpvYi5nZXQoJ2V0YScpXG4gICAgaWYgbWF4RXRhXG4gICAgICBAbWF4RXRhID0gbWF4RXRhXG4gICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS53aWR0aCgnNSUnKVxuICAgICAgQGV0YVN0YXJ0ID0gbmV3IERhdGUoKVxuICAgICAgQHN0YXJ0RXRhQ291bnRkb3duKClcblxuICAgIEAkKCdbcmVsPWRldGFpbHNdJykuY3NzKCdkaXNwbGF5JywgJ2Jsb2NrJylcbiAgICBAJCgnW3JlbD1kZXRhaWxzXScpLmNsaWNrIChlKSA9PlxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBAJCgnW3JlbD1kZXRhaWxzXScpLmhpZGUoKVxuICAgICAgQCQoJy5kZXRhaWxzJykuc2hvdygpXG4gICAgZm9yIGpvYiBpbiBAcmVwb3J0UmVzdWx0cy5tb2RlbHNcbiAgICAgIGl0ZW0gPSBuZXcgSm9iSXRlbShqb2IpXG4gICAgICBpdGVtLnJlbmRlcigpXG4gICAgICBAJCgnLmRldGFpbHMnKS5hcHBlbmQgaXRlbS5lbFxuXG4gIGdldFJlc3VsdDogKGlkKSAtPlxuICAgIHJlc3VsdHMgPSBAZ2V0UmVzdWx0cygpXG4gICAgcmVzdWx0ID0gXy5maW5kIHJlc3VsdHMsIChyKSAtPiByLnBhcmFtTmFtZSBpcyBpZFxuICAgIHVubGVzcyByZXN1bHQ/XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHJlc3VsdCB3aXRoIGlkICcgKyBpZClcbiAgICByZXN1bHQudmFsdWVcblxuICBnZXRGaXJzdFJlc3VsdDogKHBhcmFtLCBpZCkgLT5cbiAgICByZXN1bHQgPSBAZ2V0UmVzdWx0KHBhcmFtKVxuICAgIHRyeVxuICAgICAgcmV0dXJuIHJlc3VsdFswXS5mZWF0dXJlc1swXS5hdHRyaWJ1dGVzW2lkXVxuICAgIGNhdGNoIGVcbiAgICAgIHRocm93IFwiRXJyb3IgZmluZGluZyAje3BhcmFtfToje2lkfSBpbiBncCByZXN1bHRzXCJcblxuICBnZXRSZXN1bHRzOiAoKSAtPlxuICAgIHJlc3VsdHMgPSBAcmVwb3J0UmVzdWx0cy5tYXAoKHJlc3VsdCkgLT4gcmVzdWx0LmdldCgncmVzdWx0JykucmVzdWx0cylcbiAgICB1bmxlc3MgcmVzdWx0cz8ubGVuZ3RoXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGdwIHJlc3VsdHMnKVxuICAgIF8uZmlsdGVyIHJlc3VsdHMsIChyZXN1bHQpIC0+XG4gICAgICByZXN1bHQucGFyYW1OYW1lIG5vdCBpbiBbJ1Jlc3VsdENvZGUnLCAnUmVzdWx0TXNnJ11cblxuICByZWNvcmRTZXQ6IChkZXBlbmRlbmN5LCBwYXJhbU5hbWUsIHNrZXRjaENsYXNzSWQ9ZmFsc2UpIC0+XG4gICAgdW5sZXNzIGRlcGVuZGVuY3kgaW4gQGRlcGVuZGVuY2llc1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwiVW5rbm93biBkZXBlbmRlbmN5ICN7ZGVwZW5kZW5jeX1cIlxuICAgIGRlcCA9IEByZXBvcnRSZXN1bHRzLmZpbmQgKHIpIC0+IHIuZ2V0KCdzZXJ2aWNlTmFtZScpIGlzIGRlcGVuZGVuY3lcbiAgICB1bmxlc3MgZGVwXG4gICAgICBjb25zb2xlLmxvZyBAcmVwb3J0UmVzdWx0cy5tb2RlbHNcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIkNvdWxkIG5vdCBmaW5kIHJlc3VsdHMgZm9yICN7ZGVwZW5kZW5jeX0uXCJcbiAgICBwYXJhbSA9IF8uZmluZCBkZXAuZ2V0KCdyZXN1bHQnKS5yZXN1bHRzLCAocGFyYW0pIC0+XG4gICAgICBwYXJhbS5wYXJhbU5hbWUgaXMgcGFyYW1OYW1lXG4gICAgdW5sZXNzIHBhcmFtXG4gICAgICBjb25zb2xlLmxvZyBkZXAuZ2V0KCdkYXRhJykucmVzdWx0c1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwiQ291bGQgbm90IGZpbmQgcGFyYW0gI3twYXJhbU5hbWV9IGluICN7ZGVwZW5kZW5jeX1cIlxuICAgIG5ldyBSZWNvcmRTZXQocGFyYW0sIEAsIHNrZXRjaENsYXNzSWQpXG5cbiAgZW5hYmxlVGFibGVQYWdpbmc6ICgpIC0+XG4gICAgQCQoJ1tkYXRhLXBhZ2luZ10nKS5lYWNoICgpIC0+XG4gICAgICAkdGFibGUgPSAkKEApXG4gICAgICBwYWdlU2l6ZSA9ICR0YWJsZS5kYXRhKCdwYWdpbmcnKVxuICAgICAgcm93cyA9ICR0YWJsZS5maW5kKCd0Ym9keSB0cicpLmxlbmd0aFxuICAgICAgcGFnZXMgPSBNYXRoLmNlaWwocm93cyAvIHBhZ2VTaXplKVxuICAgICAgaWYgcGFnZXMgPiAxXG4gICAgICAgICR0YWJsZS5hcHBlbmQgXCJcIlwiXG4gICAgICAgICAgPHRmb290PlxuICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICA8dGQgY29sc3Bhbj1cIiN7JHRhYmxlLmZpbmQoJ3RoZWFkIHRoJykubGVuZ3RofVwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwYWdpbmF0aW9uXCI+XG4gICAgICAgICAgICAgICAgICA8dWw+XG4gICAgICAgICAgICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiPlByZXY8L2E+PC9saT5cbiAgICAgICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICA8L3RyPlxuICAgICAgICAgIDwvdGZvb3Q+XG4gICAgICAgIFwiXCJcIlxuICAgICAgICB1bCA9ICR0YWJsZS5maW5kKCd0Zm9vdCB1bCcpXG4gICAgICAgIGZvciBpIGluIF8ucmFuZ2UoMSwgcGFnZXMgKyAxKVxuICAgICAgICAgIHVsLmFwcGVuZCBcIlwiXCJcbiAgICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiPiN7aX08L2E+PC9saT5cbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgdWwuYXBwZW5kIFwiXCJcIlxuICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiPk5leHQ8L2E+PC9saT5cbiAgICAgICAgXCJcIlwiXG4gICAgICAgICR0YWJsZS5maW5kKCdsaSBhJykuY2xpY2sgKGUpIC0+XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgICAgJGEgPSAkKHRoaXMpXG4gICAgICAgICAgdGV4dCA9ICRhLnRleHQoKVxuICAgICAgICAgIGlmIHRleHQgaXMgJ05leHQnXG4gICAgICAgICAgICBhID0gJGEucGFyZW50KCkucGFyZW50KCkuZmluZCgnLmFjdGl2ZScpLm5leHQoKS5maW5kKCdhJylcbiAgICAgICAgICAgIHVubGVzcyBhLnRleHQoKSBpcyAnTmV4dCdcbiAgICAgICAgICAgICAgYS5jbGljaygpXG4gICAgICAgICAgZWxzZSBpZiB0ZXh0IGlzICdQcmV2J1xuICAgICAgICAgICAgYSA9ICRhLnBhcmVudCgpLnBhcmVudCgpLmZpbmQoJy5hY3RpdmUnKS5wcmV2KCkuZmluZCgnYScpXG4gICAgICAgICAgICB1bmxlc3MgYS50ZXh0KCkgaXMgJ1ByZXYnXG4gICAgICAgICAgICAgIGEuY2xpY2soKVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICRhLnBhcmVudCgpLnBhcmVudCgpLmZpbmQoJy5hY3RpdmUnKS5yZW1vdmVDbGFzcyAnYWN0aXZlJ1xuICAgICAgICAgICAgJGEucGFyZW50KCkuYWRkQ2xhc3MgJ2FjdGl2ZSdcbiAgICAgICAgICAgIG4gPSBwYXJzZUludCh0ZXh0KVxuICAgICAgICAgICAgJHRhYmxlLmZpbmQoJ3Rib2R5IHRyJykuaGlkZSgpXG4gICAgICAgICAgICBvZmZzZXQgPSBwYWdlU2l6ZSAqIChuIC0gMSlcbiAgICAgICAgICAgICR0YWJsZS5maW5kKFwidGJvZHkgdHJcIikuc2xpY2Uob2Zmc2V0LCBuKnBhZ2VTaXplKS5zaG93KClcbiAgICAgICAgJCgkdGFibGUuZmluZCgnbGkgYScpWzFdKS5jbGljaygpXG5cbiAgICAgIGlmIG5vUm93c01lc3NhZ2UgPSAkdGFibGUuZGF0YSgnbm8tcm93cycpXG4gICAgICAgIGlmIHJvd3MgaXMgMFxuICAgICAgICAgIHBhcmVudCA9ICR0YWJsZS5wYXJlbnQoKVxuICAgICAgICAgICR0YWJsZS5yZW1vdmUoKVxuICAgICAgICAgIHBhcmVudC5yZW1vdmVDbGFzcyAndGFibGVDb250YWluZXInXG4gICAgICAgICAgcGFyZW50LmFwcGVuZCBcIjxwPiN7bm9Sb3dzTWVzc2FnZX08L3A+XCJcblxuICBlbmFibGVMYXllclRvZ2dsZXJzOiAoKSAtPlxuICAgIGVuYWJsZUxheWVyVG9nZ2xlcnMoQCRlbClcblxuICBnZXRDaGlsZHJlbjogKHNrZXRjaENsYXNzSWQpIC0+XG4gICAgXy5maWx0ZXIgQGNoaWxkcmVuLCAoY2hpbGQpIC0+IGNoaWxkLmdldFNrZXRjaENsYXNzKCkuaWQgaXMgc2tldGNoQ2xhc3NJZFxuXG5cbm1vZHVsZS5leHBvcnRzID0gUmVwb3J0VGFiXG4iLCJtb2R1bGUuZXhwb3J0cyA9XG4gIFxuICByb3VuZDogKG51bWJlciwgZGVjaW1hbFBsYWNlcykgLT5cbiAgICB1bmxlc3MgXy5pc051bWJlciBudW1iZXJcbiAgICAgIG51bWJlciA9IHBhcnNlRmxvYXQobnVtYmVyKVxuICAgIG11bHRpcGxpZXIgPSBNYXRoLnBvdyAxMCwgZGVjaW1hbFBsYWNlc1xuICAgIE1hdGgucm91bmQobnVtYmVyICogbXVsdGlwbGllcikgLyBtdWx0aXBsaWVyIiwidGhpc1tcIlRlbXBsYXRlc1wiXSA9IHRoaXNbXCJUZW1wbGF0ZXNcIl0gfHwge307XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wibm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL2F0dHJpYnV0ZXMvYXR0cmlidXRlSXRlbVwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8dHIgZGF0YS1hdHRyaWJ1dGUtaWQ9XFxcIlwiKTtfLmIoXy52KF8uZihcImlkXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiBkYXRhLWF0dHJpYnV0ZS1leHBvcnRpZD1cXFwiXCIpO18uYihfLnYoXy5mKFwiZXhwb3J0aWRcIixjLHAsMCkpKTtfLmIoXCJcXFwiIGRhdGEtYXR0cmlidXRlLXR5cGU9XFxcIlwiKTtfLmIoXy52KF8uZihcInR5cGVcIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRkIGNsYXNzPVxcXCJuYW1lXFxcIj5cIik7Xy5iKF8udihfLmYoXCJuYW1lXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0ZCBjbGFzcz1cXFwidmFsdWVcXFwiPlwiKTtfLmIoXy52KF8uZihcImZvcm1hdHRlZFZhbHVlXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L3RyPlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wibm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL2F0dHJpYnV0ZXMvYXR0cmlidXRlc1RhYmxlXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjx0YWJsZSBjbGFzcz1cXFwiYXR0cmlidXRlc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImF0dHJpYnV0ZXNcIixjLHAsMSksYyxwLDAsNDQsODEsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihfLnJwKFwiYXR0cmlidXRlcy9hdHRyaWJ1dGVJdGVtXCIsYyxwLFwiICAgIFwiKSk7fSk7Yy5wb3AoKTt9Xy5iKFwiPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9nZW5lcmljQXR0cmlidXRlc1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtpZihfLnMoXy5kKFwic2tldGNoQ2xhc3MuZGVsZXRlZFwiLGMscCwxKSxjLHAsMCwyNCwyNzAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcImFsZXJ0IGFsZXJ0LXdhcm5cXFwiIHN0eWxlPVxcXCJtYXJnaW4tYm90dG9tOjEwcHg7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFRoaXMgc2tldGNoIHdhcyBjcmVhdGVkIHVzaW5nIHRoZSBcXFwiXCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIlxcXCIgdGVtcGxhdGUsIHdoaWNoIGlzXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBubyBsb25nZXIgYXZhaWxhYmxlLiBZb3Ugd2lsbCBub3QgYmUgYWJsZSB0byBjb3B5IHRoaXMgc2tldGNoIG9yIG1ha2UgbmV3XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBza2V0Y2hlcyBvZiB0aGlzIHR5cGUuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5cIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiIEF0dHJpYnV0ZXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihfLnJwKFwiYXR0cmlidXRlcy9hdHRyaWJ1dGVzVGFibGVcIixjLHAsXCIgICAgXCIpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvcmVwb3J0TG9hZGluZ1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRMb2FkaW5nXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwhLS0gPGRpdiBjbGFzcz1cXFwic3Bpbm5lclxcXCI+MzwvZGl2PiAtLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5SZXF1ZXN0aW5nIFJlcG9ydCBmcm9tIFNlcnZlcjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJwcm9ncmVzcyBwcm9ncmVzcy1zdHJpcGVkIGFjdGl2ZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcImJhclxcXCIgc3R5bGU9XFxcIndpZHRoOiAxMDAlO1xcXCI+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxhIGhyZWY9XFxcIiNcXFwiIHJlbD1cXFwiZGV0YWlsc1xcXCI+ZGV0YWlsczwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwiZGV0YWlsc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbmlmKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSB0aGlzW1wiVGVtcGxhdGVzXCJdO1xufSIsIk92ZXJ2aWV3VGFiID0gcmVxdWlyZSAnLi9vdmVydmlld1RhYi5jb2ZmZWUnXG5IYWJpdGF0VGFiID0gcmVxdWlyZSAnLi9oYWJpdGF0VGFiLmNvZmZlZSdcbkZpc2hpbmdWYWx1ZVRhYiA9IHJlcXVpcmUgJy4vZmlzaGluZ1ZhbHVlLmNvZmZlZSdcblxud2luZG93LmFwcC5yZWdpc3RlclJlcG9ydCAocmVwb3J0KSAtPlxuICByZXBvcnQudGFicyBbT3ZlcnZpZXdUYWIsIEhhYml0YXRUYWIsIEZpc2hpbmdWYWx1ZVRhYl1cbiAgIyBwYXRoIG11c3QgYmUgcmVsYXRpdmUgdG8gZGlzdC9cbiAgcmVwb3J0LnN0eWxlc2hlZXRzIFsnLi9maXNoU2FuY3R1YXJ5LmNzcyddXG5cbiAgIiwiUmVwb3J0VGFiID0gcmVxdWlyZSAncmVwb3J0VGFiJ1xudGVtcGxhdGVzID0gcmVxdWlyZSAnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcbl9wYXJ0aWFscyA9IHJlcXVpcmUgJy4uL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xucGFydGlhbHMgPSBbXVxuZm9yIGtleSwgdmFsIG9mIF9wYXJ0aWFsc1xuICBwYXJ0aWFsc1trZXkucmVwbGFjZSgnbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpLycsICcnKV0gPSB2YWxcblxuaWRzID0gcmVxdWlyZSAnLi9pZHMuY29mZmVlJ1xuZm9yIGtleSwgdmFsdWUgb2YgaWRzXG4gIHdpbmRvd1trZXldID0gdmFsdWVcblxuY2xhc3MgRmlzaGluZ1ZhbHVlVGFiIGV4dGVuZHMgUmVwb3J0VGFiXG4gIG5hbWU6ICdGaXNoaW5nIFZhbHVlJ1xuICBjbGFzc05hbWU6ICdmaXNoaW5nVmFsdWUnXG4gIHRlbXBsYXRlOiB0ZW1wbGF0ZXMuZmlzaGluZ1ZhbHVlXG4gIGRlcGVuZGVuY2llczogWydGaXNoaW5nVmFsdWUnXVxuICB0aW1lb3V0OiAxMjAwMDBcbiAgYXJlYUxhYmVsOiAncHJvdGVjdGVkIGFyZWEnXG5cbiAgcmVuZGVyOiAoKSAtPlxuICAgIGlzTW9vcmluZ0FyZWEgPSAoQHNrZXRjaENsYXNzLmlkIGlzIE1PT1JJTkdfSUQpXG4gICAgYXJlYUxhYmVsID0gQHNrZXRjaENsYXNzLmF0dHJpYnV0ZXMubmFtZVxuICAgIGNvbnRleHQgPVxuICAgICAgc2tldGNoOiBAbW9kZWwuZm9yVGVtcGxhdGUoKVxuICAgICAgc2tldGNoQ2xhc3M6IEBza2V0Y2hDbGFzcy5mb3JUZW1wbGF0ZSgpXG4gICAgICBhdHRyaWJ1dGVzOiBAbW9kZWwuZ2V0QXR0cmlidXRlcygpXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgcGVyY2VudDogQHJlY29yZFNldCgnRmlzaGluZ1ZhbHVlJywgJ0Zpc2hpbmdWYWx1ZScpLmZsb2F0KCdQRVJDRU5UJywgMilcbiAgICAgIGFyZWFMYWJlbDogYXJlYUxhYmVsXG4gICAgICBpc01vb3JpbmdBcmVhOiBpc01vb3JpbmdBcmVhXG4gICAgXG4gICAgQCRlbC5odG1sIEB0ZW1wbGF0ZS5yZW5kZXIoY29udGV4dCwgdGVtcGxhdGVzKVxuICAgIEBlbmFibGVMYXllclRvZ2dsZXJzKEAkZWwpXG5cblxubW9kdWxlLmV4cG9ydHMgPSBGaXNoaW5nVmFsdWVUYWIiLCJSZXBvcnRUYWIgPSByZXF1aXJlICdyZXBvcnRUYWInXG50ZW1wbGF0ZXMgPSByZXF1aXJlICcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuXG5jbGFzcyBIYWJpdGF0VGFiIGV4dGVuZHMgUmVwb3J0VGFiXG4gIG5hbWU6ICdIYWJpdGF0J1xuICBjbGFzc05hbWU6ICdoYWJpdGF0J1xuICB0ZW1wbGF0ZTogdGVtcGxhdGVzLmhhYml0YXRcbiAgZGVwZW5kZW5jaWVzOiBbXG4gICAgJ0JhcmJ1ZGFIYWJpdGF0J1xuICAgICdNYXJ4YW5BbmFseXNpcydcbiAgXVxuICBwYXJhbU5hbWU6ICdIYWJpdGF0cydcbiAgdGltZW91dDogMTIwMDAwXG4gIGhlYWRpbmc6IFwiSGFiaXRhdCBSZXByZXNlbnRhdGlvblwiXG4gIFxuICByZW5kZXI6ICgpIC0+XG4gICAgZGVwTmFtZSA9IEBkZXBlbmRlbmNpZXNbMF1cbiAgICBkYXRhID0gQHJlY29yZFNldChkZXBOYW1lLCBAcGFyYW1OYW1lKS50b0FycmF5KClcbiAgICBjb250ZXh0ID1cbiAgICAgIHNrZXRjaDogQG1vZGVsLmZvclRlbXBsYXRlKClcbiAgICAgIHNrZXRjaENsYXNzOiBAc2tldGNoQ2xhc3MuZm9yVGVtcGxhdGUoKVxuICAgICAgYXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKVxuICAgICAgYWRtaW46IEBwcm9qZWN0LmlzQWRtaW4gd2luZG93LnVzZXJcbiAgICAgIGhhYml0YXRzOiBkYXRhXG4gICAgICBoZWFkaW5nOiBAaGVhZGluZ1xuICAgICAgbWFyeGFuQW5hbHlzZXM6IF8ubWFwKEByZWNvcmRTZXQoXCJNYXJ4YW5BbmFseXNpc1wiLCBcIk1hcnhhbkFuYWx5c2lzXCIpXG4gICAgICAgIC50b0FycmF5KCksIChmKSAtPiBmLk5BTUUpXG4gICAgXG4gICAgQCRlbC5odG1sIEB0ZW1wbGF0ZS5yZW5kZXIoY29udGV4dCwgdGVtcGxhdGVzKVxuICAgIEBlbmFibGVMYXllclRvZ2dsZXJzKEAkZWwpXG4gICAgQCQoJy5jaG9zZW4nKS5jaG9zZW4oe2Rpc2FibGVfc2VhcmNoX3RocmVzaG9sZDogMTAsIHdpZHRoOic0MDBweCd9KVxuICAgIEAkKCcuY2hvc2VuJykuY2hhbmdlICgpID0+XG4gICAgICBfLmRlZmVyIEByZW5kZXJNYXJ4YW5BbmFseXNpc1xuICAgIEByZW5kZXJNYXJ4YW5BbmFseXNpcygpXG5cbiAgcmVuZGVyTWFyeGFuQW5hbHlzaXM6ICgpID0+XG4gICAgaWYgd2luZG93LmQzXG4gICAgICBuYW1lID0gQCQoJy5jaG9zZW4nKS52YWwoKVxuICAgICAgcmVjb3JkcyA9IEByZWNvcmRTZXQoXCJNYXJ4YW5BbmFseXNpc1wiLCBcIk1hcnhhbkFuYWx5c2lzXCIpLnRvQXJyYXkoKVxuICAgICAgcXVhbnRpbGVfcmFuZ2UgPSB7XCJRMFwiOlwidmVyeSBsb3dcIiwgXCJRMjBcIjogXCJsb3dcIixcIlE0MFwiOiBcIm1pZFwiLFwiUTYwXCI6IFwiaGlnaFwiLFwiUTgwXCI6IFwidmVyeSBoaWdoXCJ9XG4gICAgICBkYXRhID0gXy5maW5kIHJlY29yZHMsIChyZWNvcmQpIC0+IHJlY29yZC5OQU1FIGlzIG5hbWVcbiAgICAgIGhpc3RvID0gZGF0YS5ISVNUTy5zbGljZSgxLCBkYXRhLkhJU1RPLmxlbmd0aCAtIDEpLnNwbGl0KC9cXHMvKVxuICAgICAgaGlzdG8gPSBfLmZpbHRlciBoaXN0bywgKHMpIC0+IHMubGVuZ3RoID4gMFxuICAgICAgaGlzdG8gPSBfLm1hcCBoaXN0bywgKHZhbCkgLT5cbiAgICAgICAgcGFyc2VJbnQodmFsKVxuICAgICAgcXVhbnRpbGVzID0gXy5maWx0ZXIoXy5rZXlzKGRhdGEpLCAoa2V5KSAtPiBrZXkuaW5kZXhPZignUScpIGlzIDApXG4gICAgICBmb3IgcSwgaSBpbiBxdWFudGlsZXNcbiAgICAgICAgaWYgcGFyc2VGbG9hdChkYXRhW3FdKSA+IHBhcnNlRmxvYXQoZGF0YS5TQ09SRSkgb3IgaSBpcyBxdWFudGlsZXMubGVuZ3RoIC0gMVxuICAgICAgICAgIG1heF9xID0gcXVhbnRpbGVzW2ldXG4gICAgICAgICAgbWluX3EgPSBxdWFudGlsZXNbaSAtIDFdIG9yIFwiUTBcIiAjIHF1YW50aWxlc1tpXVxuICAgICAgICAgIHF1YW50aWxlX2Rlc2MgPSBxdWFudGlsZV9yYW5nZVttaW5fcV1cbiAgICAgICAgICBicmVha1xuICAgICAgQCQoJy5zY2VuYXJpb1Jlc3VsdHMnKS5odG1sIFwiXCJcIlxuICAgICAgICBUaGUgYXZlcmFnZSBNYXJ4YW4gc2NvcmUgZm9yIHRoaXMgem9uZSBpcyA8c3Ryb25nPiN7ZGF0YS5TQ09SRX08L3N0cm9uZz4sIHBsYWNpbmcgaXQgaW4gXG4gICAgICAgIHRoZSA8c3Ryb25nPiN7cXVhbnRpbGVfZGVzY308L3N0cm9uZz4gcXVhbnRpbGUgcmFuZ2UgPHN0cm9uZz4oI3ttaW5fcS5yZXBsYWNlKCdRJywgJycpfSUgLSAje21heF9xLnJlcGxhY2UoJ1EnLCAnJyl9JSk8L3N0cm9uZz4gXG4gICAgICAgIGZvciB0aGlzIHN1Yi1yZWdpb24uIEFsbCBNYXJ4YW4gcGxhbm5pbmcgdW5pdHMgZm9yIHRoZSBzdWItcmVnaW9uIGhhdmUgYmVlbiByYW5rZWQgYnkgc3VtIHNvbHV0aW9uIFxuICAgICAgICBzY29yZSBhbmQgZGl2aWRlZCBpbnRvIGZpdmUgcXVhbnRpbGVzIG9mIGVxdWFsIHByb3BvcnRpb24uXG4gICAgICBcIlwiXCJcblxuICAgICAgQCQoJy5zY2VuYXJpb0Rlc2NyaXB0aW9uJykuaHRtbCBkYXRhLk1BUlhfREVTQ1xuXG4gICAgICBkb21haW4gPSBfLm1hcCBxdWFudGlsZXMsIChxKSAtPiBkYXRhW3FdXG4gICAgICBkb21haW4ucHVzaCAxMDBcbiAgICAgIGRvbWFpbi51bnNoaWZ0IDBcbiAgICAgIGNvbG9yID0gZDMuc2NhbGUubGluZWFyKClcbiAgICAgICAgLmRvbWFpbihkb21haW4pXG4gICAgICAgIC5yYW5nZShbXCIjNDdhZTQzXCIsIFwiIzZjMFwiLCBcIiNlZTBcIiwgXCIjZWI0XCIsIFwiI2VjYmI4OVwiLCBcIiNlZWFiYTBcIl0ucmV2ZXJzZSgpKVxuICAgICAgcXVhbnRpbGVzID0gXy5tYXAgcXVhbnRpbGVzLCAoa2V5KSAtPlxuICAgICAgICBtYXggPSBwYXJzZUZsb2F0KGRhdGFba2V5XSlcbiAgICAgICAgbWluICA9IHBhcnNlRmxvYXQoZGF0YVtxdWFudGlsZXNbXy5pbmRleE9mKHF1YW50aWxlcywga2V5KSAtIDFdXSBvciAwKVxuICAgICAgICB7XG4gICAgICAgICAgcmFuZ2U6IFwiI3twYXJzZUludChrZXkucmVwbGFjZSgnUScsICcnKSkgLSAyMH0tI3trZXkucmVwbGFjZSgnUScsICcnKX0lXCJcbiAgICAgICAgICBuYW1lOiBrZXlcbiAgICAgICAgICBzdGFydDogbWluXG4gICAgICAgICAgZW5kOiBtYXhcbiAgICAgICAgICBiZzogY29sb3IoKG1heCArIG1pbikgLyAyKVxuICAgICAgICB9XG5cbiAgICAgIEAkKCcudml6JykuaHRtbCgnJylcbiAgICAgIGVsID0gQCQoJy52aXonKVswXVxuICAgICAgeCA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgICAgIC5kb21haW4oWzAsIDEwMF0pXG4gICAgICAgIC5yYW5nZShbMCwgNDAwXSkgICAgICBcblxuICAgICAgIyBIaXN0b2dyYW1cbiAgICAgIG1hcmdpbiA9IFxuICAgICAgICB0b3A6IDVcbiAgICAgICAgcmlnaHQ6IDIwXG4gICAgICAgIGJvdHRvbTogMzBcbiAgICAgICAgbGVmdDogNDVcbiAgICAgIHdpZHRoID0gNDAwIC0gbWFyZ2luLmxlZnQgLSBtYXJnaW4ucmlnaHRcbiAgICAgIGhlaWdodCA9IDMwMCAtIG1hcmdpbi50b3AgLSBtYXJnaW4uYm90dG9tXG4gICAgICBcbiAgICAgIHggPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgICAgICAuZG9tYWluKFswLCAxMDBdKVxuICAgICAgICAucmFuZ2UoWzAsIHdpZHRoXSlcbiAgICAgIHkgPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgICAgICAucmFuZ2UoW2hlaWdodCwgMF0pXG4gICAgICAgIC5kb21haW4oWzAsIGQzLm1heChoaXN0byldKVxuXG4gICAgICB4QXhpcyA9IGQzLnN2Zy5heGlzKClcbiAgICAgICAgLnNjYWxlKHgpXG4gICAgICAgIC5vcmllbnQoXCJib3R0b21cIilcbiAgICAgIHlBeGlzID0gZDMuc3ZnLmF4aXMoKVxuICAgICAgICAuc2NhbGUoeSlcbiAgICAgICAgLm9yaWVudChcImxlZnRcIilcblxuICAgICAgc3ZnID0gZDMuc2VsZWN0KEAkKCcudml6JylbMF0pLmFwcGVuZChcInN2Z1wiKVxuICAgICAgICAuYXR0cihcIndpZHRoXCIsIHdpZHRoICsgbWFyZ2luLmxlZnQgKyBtYXJnaW4ucmlnaHQpXG4gICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodCArIG1hcmdpbi50b3AgKyBtYXJnaW4uYm90dG9tKVxuICAgICAgLmFwcGVuZChcImdcIilcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoI3ttYXJnaW4ubGVmdH0sICN7bWFyZ2luLnRvcH0pXCIpXG5cbiAgICAgIHN2Zy5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ4IGF4aXNcIilcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMCwje2hlaWdodH0pXCIpXG4gICAgICAgIC5jYWxsKHhBeGlzKVxuICAgICAgLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIHdpZHRoIC8gMilcbiAgICAgICAgLmF0dHIoXCJkeVwiLCBcIjNlbVwiKVxuICAgICAgICAuc3R5bGUoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxuICAgICAgICAudGV4dChcIlNjb3JlXCIpXG5cbiAgICAgIHN2Zy5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ5IGF4aXNcIilcbiAgICAgICAgLmNhbGwoeUF4aXMpXG4gICAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInJvdGF0ZSgtOTApXCIpXG4gICAgICAgIC5hdHRyKFwieVwiLCA2KVxuICAgICAgICAuYXR0cihcImR5XCIsIFwiLjcxZW1cIilcbiAgICAgICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcbiAgICAgICAgLnRleHQoXCJOdW1iZXIgb2YgUGxhbm5pbmcgVW5pdHNcIilcblxuICAgICAgc3ZnLnNlbGVjdEFsbChcIi5iYXJcIilcbiAgICAgICAgICAuZGF0YShoaXN0bylcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwicmVjdFwiKVxuICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJiYXJcIilcbiAgICAgICAgICAuYXR0cihcInhcIiwgKGQsIGkpIC0+IHgoaSkpXG4gICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCAod2lkdGggLyAxMDApKVxuICAgICAgICAgIC5hdHRyKFwieVwiLCAoZCkgLT4geShkKSlcbiAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCAoZCkgLT4gaGVpZ2h0IC0geShkKSlcbiAgICAgICAgICAuc3R5bGUgJ2ZpbGwnLCAoZCwgaSkgLT5cbiAgICAgICAgICAgIHEgPSBfLmZpbmQgcXVhbnRpbGVzLCAocSkgLT5cbiAgICAgICAgICAgICAgaSA+PSBxLnN0YXJ0IGFuZCBpIDw9IHEuZW5kXG4gICAgICAgICAgICBxPy5iZyBvciBcInN0ZWVsYmx1ZVwiXG5cbiAgICAgIHN2Zy5zZWxlY3RBbGwoXCIuc2NvcmVcIilcbiAgICAgICAgICAuZGF0YShbTWF0aC5yb3VuZChkYXRhLlNDT1JFKV0pXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInNjb3JlXCIpXG4gICAgICAgIC5hdHRyKFwieFwiLCAoZCkgLT4gKHgoZCkgLSA4ICkrICdweCcpXG4gICAgICAgIC5hdHRyKFwieVwiLCAoZCkgLT4gKHkoaGlzdG9bZF0pIC0gMTApICsgJ3B4JylcbiAgICAgICAgLnRleHQoXCLilrxcIilcblxuICAgICAgc3ZnLnNlbGVjdEFsbChcIi5zY29yZVRleHRcIilcbiAgICAgICAgICAuZGF0YShbTWF0aC5yb3VuZChkYXRhLlNDT1JFKV0pXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInNjb3JlVGV4dFwiKVxuICAgICAgICAuYXR0cihcInhcIiwgKGQpIC0+ICh4KGQpIC0gNiApKyAncHgnKVxuICAgICAgICAuYXR0cihcInlcIiwgKGQpIC0+ICh5KGhpc3RvW2RdKSAtIDMwKSArICdweCcpXG4gICAgICAgIC50ZXh0KChkKSAtPiBkKVxuXG4gICAgICBAJCgnLnZpeicpLmFwcGVuZCAnPGRpdiBjbGFzcz1cImxlZ2VuZHNcIj48L2Rpdj4nXG4gICAgICBmb3IgcXVhbnRpbGUgaW4gcXVhbnRpbGVzXG4gICAgICAgIEAkKCcudml6IC5sZWdlbmRzJykuYXBwZW5kIFwiXCJcIlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJsZWdlbmRcIj48c3BhbiBzdHlsZT1cImJhY2tncm91bmQtY29sb3I6I3txdWFudGlsZS5iZ307XCI+Jm5ic3A7PC9zcGFuPiN7cXVhbnRpbGUucmFuZ2V9PC9kaXY+XG4gICAgICAgIFwiXCJcIlxuICAgICAgQCQoJy52aXonKS5hcHBlbmQgJzxiciBzdHlsZT1cImNsZWFyOmJvdGg7XCI+J1xubW9kdWxlLmV4cG9ydHMgPSBIYWJpdGF0VGFiIiwibW9kdWxlLmV4cG9ydHMgPSBcbiAgU0FOQ1RVQVJZX0lEOiAnNTMzZGU5NmJhNDk4ODY3YzU2YzZkMWM1J1xuICBBUVVBQ1VMVFVSRV9JRDogJzUyMGJiMWMwMGJkMjJjOWIyMTQ3Yjk5YidcbiAgTU9PUklOR19JRDogJzUzM2RlNGUzYTQ5ODg2N2M1NmM2Y2Q0NSdcbiAgTk9fTkVUX1pPTkVTX0lEOiAnNTMzZGU2MjBhNDk4ODY3YzU2YzZjZmMyJ1xuIiwiUmVwb3J0VGFiID0gcmVxdWlyZSAncmVwb3J0VGFiJ1xudGVtcGxhdGVzID0gcmVxdWlyZSAnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcbl9wYXJ0aWFscyA9IHJlcXVpcmUgJy4uL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xucGFydGlhbHMgPSBbXVxuZm9yIGtleSwgdmFsIG9mIF9wYXJ0aWFsc1xuICBwYXJ0aWFsc1trZXkucmVwbGFjZSgnbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpLycsICcnKV0gPSB2YWxcbnJvdW5kID0gcmVxdWlyZSgnYXBpL3V0aWxzJykucm91bmRcbmlkcyA9IHJlcXVpcmUgJy4vaWRzLmNvZmZlZSdcbmZvciBrZXksIHZhbHVlIG9mIGlkc1xuICB3aW5kb3dba2V5XSA9IHZhbHVlXG5cblxuVE9UQUxfQVJFQSA9IDE3NS45NSAjIHNxIG1pbGVzXG4jIERpYW1ldGVyIGV2YWx1YXRpb24gYW5kIHZpc3VhbGl6YXRpb24gcGFyYW1ldGVyc1xuUkVDT01NRU5ERURfRElBTUVURVIgPSBcbiAgbWluOiAyXG4gIG1heDogM1xuXG5jbGFzcyBPdmVydmlld1RhYiBleHRlbmRzIFJlcG9ydFRhYlxuICBuYW1lOiAnU2l6ZSdcbiAgY2xhc3NOYW1lOiAnb3ZlcnZpZXcnXG4gIHRlbXBsYXRlOiB0ZW1wbGF0ZXMub3ZlcnZpZXdcblxuICBkZXBlbmRlbmNpZXM6IFsnRGlhbWV0ZXInXVxuICB0aW1lb3V0OiA2MDAwMFxuICAjICByZW5kZXJNaW5pbXVtV2lkdGg6IHRydWVcbiAgcmVuZGVyOiAoKSAtPlxuXG4gICAgTUlOX0RJQU0gPSBAcmVjb3JkU2V0KCdEaWFtZXRlcicsICdEaWFtZXRlcicpLmZsb2F0KCdNSU5fRElBTScpXG4gICAgU1FfTUlMRVMgPSBAcmVjb3JkU2V0KCdEaWFtZXRlcicsICdEaWFtZXRlcicpLmZsb2F0KCdTUV9NSUxFUycpXG4gICAgUEVSQ0VOVCA9IChTUV9NSUxFUyAvIFRPVEFMX0FSRUEpICogMTAwLjBcbiAgICBpZiBNSU5fRElBTSA+IFJFQ09NTUVOREVEX0RJQU1FVEVSLm1pblxuICAgICAgRElBTV9PSyA9IHRydWVcbiAgICBcbiAgICBza2lkID0gQG1vZGVsLmdldEF0dHJpYnV0ZSgnU0NfSUQnKVxuICAgIGlzTm9OZXRab25lID0gKEBza2V0Y2hDbGFzcy5pZCBpcyBOT19ORVRfWk9ORVNfSUQpXG4gICAgaXNNb29yaW5nQXJlYSA9IChAc2tldGNoQ2xhc3MuaWQgaXMgTU9PUklOR19JRClcbiAgICByZW5kZXJNaW5pbXVtV2lkdGggPSAoIWlzTm9OZXRab25lIGFuZCAhaXNNb29yaW5nQXJlYSlcbiAgICBjb250ZXh0ID1cbiAgICAgIHNrZXRjaDogQG1vZGVsLmZvclRlbXBsYXRlKClcbiAgICAgIHNrZXRjaENsYXNzOiBAc2tldGNoQ2xhc3MuZm9yVGVtcGxhdGUoKVxuICAgICAgYXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKVxuICAgICAgYW55QXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKS5sZW5ndGggPiAwXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgZGVzY3JpcHRpb246IEBtb2RlbC5nZXRBdHRyaWJ1dGUoJ0RFU0NSSVBUSU9OJylcbiAgICAgIGhhc0Rlc2NyaXB0aW9uOiBAbW9kZWwuZ2V0QXR0cmlidXRlKCdERVNDUklQVElPTicpPy5sZW5ndGggPiAwXG4gICAgICBESUFNX09LOiBESUFNX09LXG4gICAgICBTUV9NSUxFUzogU1FfTUlMRVNcbiAgICAgIERJQU06IE1JTl9ESUFNXG4gICAgICBNSU5fRElBTTogUkVDT01NRU5ERURfRElBTUVURVIubWluXG4gICAgICByZW5kZXJNaW5pbXVtV2lkdGg6IHJlbmRlck1pbmltdW1XaWR0aFxuICAgICAgUEVSQ0VOVDogcm91bmQoUEVSQ0VOVCwgMClcbiAgICAgIGlzTm9OZXRab25lOiBpc05vTmV0Wm9uZVxuICAgICAgaXNNb29yaW5nQXJlYTogaXNNb29yaW5nQXJlYVxuICAgIFxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHBhcnRpYWxzKVxuICAgIGlmIHJlbmRlck1pbmltdW1XaWR0aFxuICAgICAgQGVuYWJsZUxheWVyVG9nZ2xlcnMoQCRlbClcbiAgICAgIEBkcmF3Vml6KE1JTl9ESUFNKVxuXG4gIGRyYXdWaXo6IChkaWFtKSAtPlxuICAgIGlmIHdpbmRvdy5kM1xuICAgICAgZWwgPSBAJCgnLnZpeicpWzBdXG4gICAgICBtYXhTY2FsZSA9IGQzLm1heChbUkVDT01NRU5ERURfRElBTUVURVIubWF4ICogMS4yLCBkaWFtICogMS4yXSlcbiAgICAgIHJhbmdlcyA9IFtcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdCZWxvdyByZWNvbW1lbmRlZCdcbiAgICAgICAgICBzdGFydDogMFxuICAgICAgICAgIGVuZDogUkVDT01NRU5ERURfRElBTUVURVIubWluXG4gICAgICAgICAgYmc6IFwiIzhlNWU1MFwiXG4gICAgICAgICAgY2xhc3M6ICdiZWxvdydcbiAgICAgICAgfVxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ1JlY29tbWVuZGVkJ1xuICAgICAgICAgIHN0YXJ0OiBSRUNPTU1FTkRFRF9ESUFNRVRFUi5taW5cbiAgICAgICAgICBlbmQ6IFJFQ09NTUVOREVEX0RJQU1FVEVSLm1heFxuICAgICAgICAgIGJnOiAnIzU4OGUzZidcbiAgICAgICAgICBjbGFzczogJ3JlY29tbWVuZGVkJ1xuICAgICAgICB9XG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiAnQWJvdmUgcmVjb21tZW5kZWQnXG4gICAgICAgICAgc3RhcnQ6IFJFQ09NTUVOREVEX0RJQU1FVEVSLm1heFxuICAgICAgICAgIGVuZDogbWF4U2NhbGVcbiAgICAgICAgICBjbGFzczogJ2Fib3ZlJ1xuICAgICAgICB9XG4gICAgICBdXG5cbiAgICAgIHggPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgICAgICAuZG9tYWluKFswLCBtYXhTY2FsZV0pXG4gICAgICAgIC5yYW5nZShbMCwgNDAwXSlcbiAgICAgIFxuICAgICAgY2hhcnQgPSBkMy5zZWxlY3QoZWwpXG4gICAgICBjaGFydC5zZWxlY3RBbGwoXCJkaXYucmFuZ2VcIilcbiAgICAgICAgLmRhdGEocmFuZ2VzKVxuICAgICAgLmVudGVyKCkuYXBwZW5kKFwiZGl2XCIpXG4gICAgICAgIC5zdHlsZShcIndpZHRoXCIsIChkKSAtPiB4KGQuZW5kIC0gZC5zdGFydCkgKyAncHgnKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIChkKSAtPiBcInJhbmdlIFwiICsgZC5jbGFzcylcbiAgICAgICAgLmFwcGVuZChcInNwYW5cIilcbiAgICAgICAgICAudGV4dCgoZCkgLT4gaWYgeChkLmVuZCAtIGQuc3RhcnQpID4gMTEwIHRoZW4gZC5uYW1lIGVsc2UgJycpXG4gICAgICAgICAgLmFwcGVuZChcInNwYW5cIilcbiAgICAgICAgICAgIC50ZXh0IChkKSAtPlxuICAgICAgICAgICAgICBpZiBkLmNsYXNzIGlzICdhYm92ZSdcbiAgICAgICAgICAgICAgICBcIj4gI3tkLnN0YXJ0fSBtaWxlc1wiXG4gICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBcIiN7ZC5zdGFydH0tI3tkLmVuZH0gbWlsZXNcIlxuXG4gICAgICBjaGFydC5zZWxlY3RBbGwoXCJkaXYuZGlhbVwiKVxuICAgICAgICAuZGF0YShbZGlhbV0pXG4gICAgICAuZW50ZXIoKS5hcHBlbmQoXCJkaXZcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImRpYW1cIilcbiAgICAgICAgLnN0eWxlKFwibGVmdFwiLCAoZCkgLT4geChkKSArICdweCcpXG4gICAgICAgIC50ZXh0KChkKSAtPiBcIlwiKVxuXG5cbm1vZHVsZS5leHBvcnRzID0gT3ZlcnZpZXdUYWIiLCJ0aGlzW1wiVGVtcGxhdGVzXCJdID0gdGhpc1tcIlRlbXBsYXRlc1wiXSB8fCB7fTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJhcXVhY3VsdHVyZUZpc2hpbmdWYWx1ZVwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5GaXNoaW5nIFZhbHVlPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoaXMgYXF1YWN1bHR1cmUgYXJlYSBkaXNwbGFjZXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJwZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgb2YgdGhlIGZpc2hpbmcgdmFsdWUgd2l0aGluIEJhcmJ1ZGHigJlzIHdhdGVycywgYmFzZWQgb24gdXNlciByZXBvcnRlZFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICB2YWx1ZXMgb2YgZmlzaGluZyBncm91bmRzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTMzZjE2ZjZhNDk4ODY3YzU2YzZmYjU3XFxcIj5zaG93IGZpc2hpbmcgdmFsdWVzIGxheWVyPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiYXJyYXlGaXNoaW5nVmFsdWVcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RGlzcGxhY2VkIEZpc2hpbmcgVmFsdWU8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwic2FuY3R1YXJpZXNcIixjLHAsMSksYyxwLDAsMTAzLDM4OSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7aWYoXy5zKF8uZihcImFxdWFjdWx0dXJlQXJlYXNcIixjLHAsMSksYyxwLDAsMTI5LDM2MyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIFRoaXMgcHJvcG9zYWwgaW5jbHVkZXMgYm90aCBTYW5jdHVhcnkgYW5kIEFxdWFjdWx0dXJlIGFyZWFzLCBkaXNwbGFjaW5nXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwic2FuY3R1YXJ5UGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gYW5kIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiYXF1YWN1bHR1cmVBcmVhUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIG9mIGZpc2hpbmcgdmFsdWUgd2l0aGluIEJhcmJ1ZGEncyB3YXRlcnMsIHJlc3BlY3RpdmVseS5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fX0pO2MucG9wKCk7fWlmKF8ucyhfLmYoXCJzYW5jdHVhcmllc1wiLGMscCwxKSxjLHAsMCw0MjYsNzY1LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtpZighXy5zKF8uZihcImFxdWFjdWx0dXJlQXJlYXNcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgICAgVGhpcyBwcm9wb3NhbCBpbmNsdWRlcyBcIik7Xy5iKF8udihfLmYoXCJudW1TYW5jdHVhcmllc1wiLGMscCwwKSkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFwiKTtpZihfLnMoXy5mKFwic2FuY1BsdXJhbFwiLGMscCwxKSxjLHAsMCw1MTgsNTI5LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJTYW5jdHVhcmllc1wiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcInNhbmNQbHVyYWxcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJTYW5jdHVhcnlcIik7fTtfLmIoXCIsXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIGRpc3BsYWNpbmcgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJzYW5jdHVhcnlQZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiBmaXNoaW5nIHZhbHVlIHdpdGhpbiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgQmFyYnVkYSdzIHdhdGVycyBiYXNlZCBvbiB1c2VyIHJlcG9ydGVkIHZhbHVlcyBvZiBmaXNoaW5nIGdyb3VuZHMuXCIpO18uYihcIlxcblwiKTt9O30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwic2FuY3R1YXJpZXNcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtpZihfLnMoXy5mKFwiYXF1YWN1bHR1cmVBcmVhc1wiLGMscCwxKSxjLHAsMCw4MjgsMTEzNSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIDxicj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGJyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGlzIHByb3Bvc2FsIGluY2x1ZGVzIFwiKTtfLmIoXy52KF8uZihcIm51bUFxdWFjdWx0dXJlQXJlYXNcIixjLHAsMCkpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBBcXVhY3VsdHVyZSBBcmVhXCIpO2lmKF8ucyhfLmYoXCJhcXVhY3VsdHVyZUFyZWFzUGx1cmFsXCIsYyxwLDEpLGMscCwwLDk0NSw5NDYsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiLFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBkaXNwbGFjaW5nIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiYXF1YWN1bHR1cmVBcmVhUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgZmlzaGluZyB2YWx1ZSB3aXRoaW4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIEJhcmJ1ZGEncyB3YXRlcnMgYmFzZWQgb24gdXNlciByZXBvcnRlZCB2YWx1ZXMgb2YgZmlzaGluZyBncm91bmRzLlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9fTtpZihfLnMoXy5mKFwibW9vcmluZ3NcIixjLHAsMSksYyxwLDAsMTE5NSwxNTI1LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPGJyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8YnI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFwiKTtfLmIoXy52KF8uZihcIm51bU1vb3JpbmdzXCIsYyxwLDApKSk7Xy5iKFwiIE1vb3JpbmcgQXJlYVwiKTtpZihfLnMoXy5mKFwibW9vcmluZ3NQbHVyYWxcIixjLHAsMSksYyxwLDAsMTI2NSwxMjcwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzIGFyZVwiKTt9KTtjLnBvcCgpO31fLmIoXCIgXCIpO2lmKCFfLnMoXy5mKFwibW9vcmluZ3NQbHVyYWxcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJpc1wiKTt9O18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIGFsc28gaW5jbHVkZWQsIHdoaWNoIGNvdmVyXCIpO2lmKCFfLnMoXy5mKFwibW9vcmluZ3NQbHVyYWxcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJzXCIpO307Xy5iKFwiIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibW9vcmluZ0FyZWFQZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgcmVnaW9uYWwgZmlzaGluZyB2YWx1ZS4gTW9vcmluZyBhcmVhcyBtYXkgZGlzcGxhY2UgZmlzaGluZyBhY3Rpdml0aWVzLlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoXy5zKF8uZihcImhhc05vTmV0Wm9uZXNcIixjLHAsMSksYyxwLDAsMTU2MSwxOTAzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPGJyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8YnI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFwiKTtfLmIoXy52KF8uZihcIm51bU5vTmV0Wm9uZXNcIixjLHAsMCkpKTtfLmIoXCIgTm90IE5ldCBab25lXCIpO2lmKF8ucyhfLmYoXCJub05ldFpvbmVzUGx1cmFsXCIsYyxwLDEpLGMscCwwLDE2MzUsMTY0MCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwicyBhcmVcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiIFwiKTtpZighXy5zKF8uZihcIm5vTmV0Wm9uZXNQbHVyYWxcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJpc1wiKTt9O18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIGFsc28gaW5jbHVkZWQsIHdoaWNoIGNvdmVyXCIpO2lmKCFfLnMoXy5mKFwibm9OZXRab25lc1BsdXJhbFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcInNcIik7fTtfLmIoXCIgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJub05ldFpvbmVzUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIHJlZ2lvbmFsIGZpc2hpbmcgdmFsdWUuIE5vIE5ldCBab25lcyBtYXkgZGlzcGxhY2UgZmlzaGluZyBhY3Rpdml0aWVzLlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MzNmMTZmNmE0OTg4NjdjNTZjNmZiNTdcXFwiPnNob3cgZmlzaGluZyB2YWx1ZXMgbGF5ZXI8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiZmlzaGluZ0FyZWFzXCIsYyxwLDEpLGMscCwwLDIwNDIsMjQxNCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+UHJpb3JpdHkgRmlzaGluZyBBcmVhczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGlzIHByb3Bvc2FsIGluY2x1ZGVzIFwiKTtfLmIoXy52KF8uZihcIm51bUZpc2hpbmdBcmVhc1wiLGMscCwwKSkpO18uYihcIiBGaXNoaW5nIFByaW9yaXR5IFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBBcmVhXCIpO2lmKF8ucyhfLmYoXCJmaXNoaW5nQXJlYVB1cmFsXCIsYyxwLDEpLGMscCwwLDIyMTksMjIyMCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic1wiKTt9KTtjLnBvcCgpO31fLmIoXCIsIHJlcHJlc2VudGluZ1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImZpc2hpbmdBcmVhUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgdGhlIGZpc2hpbmcgdmFsdWUgd2l0aGluIEJhcmJ1ZGEncyBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgd2F0ZXJzIGJhc2VkIG9uIHVzZXIgcmVwb3J0ZWQgdmFsdWVzIG9mIGZpc2hpbmcgZ3JvdW5kc1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiYXJyYXlIYWJpdGF0c1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtpZihfLnMoXy5mKFwic2FuY3R1YXJpZXNcIixjLHAsMSksYyxwLDAsMTYsOTE5LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5IYWJpdGF0cyB3aXRoaW4gXCIpO18uYihfLnYoXy5mKFwibnVtU2FuY3R1YXJpZXNcIixjLHAsMCkpKTtfLmIoXCIgXCIpO2lmKCFfLnMoXy5mKFwic2FuY3R1YXJ5UGx1cmFsXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiU2FuY3R1YXJ5XCIpO307aWYoXy5zKF8uZihcInNhbmN0dWFyeVBsdXJhbFwiLGMscCwxKSxjLHAsMCwxNzAsMTgxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJTYW5jdHVhcmllc1wiKTt9KTtjLnBvcCgpO31fLmIoXCI8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkhhYml0YXQ8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPlBlcmNlbnQgb2YgVG90YWwgSGFiaXRhdDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+TWVldHMgMzMlIGdvYWw8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwic2FuY3R1YXJ5SGFiaXRhdFwiLGMscCwxKSxjLHAsMCw0MDMsNjE2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHIgY2xhc3M9XFxcIlwiKTtpZihfLnMoXy5mKFwibWVldHNHb2FsXCIsYyxwLDEpLGMscCwwLDQzNSw0NDIsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIm1ldEdvYWxcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJIYWJUeXBlXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJQZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiICU8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtpZihfLnMoXy5mKFwibWVldHNHb2FsXCIsYyxwLDEpLGMscCwwLDU0NSw1NDgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInllc1wiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcIm1lZXRzR29hbFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIm5vXCIpO307Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFBlcmNlbnRhZ2VzIHNob3duIHJlcHJlc2VudCB0aGUgcHJvcG9ydGlvbiBvZiBoYWJpdGF0cyBhdmFpbGFibGUgaW4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIEJhcmJ1ZGEncyBlbnRpcmUgMyBuYXV0aWNhbCBtaWxlIGJvdW5kYXJ5IGNhcHR1cmVkIHdpdGhpbiBzYW5jdHVhcmllcy4gPGJyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MzNkZGY4NmE0OTg4NjdjNTZjNmM4MzBcXFwiPnNob3cgaGFiaXRhdHMgbGF5ZXI8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJtb29yaW5nc1wiLGMscCwxKSxjLHAsMCw5NTAsMTU2MSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+SGFiaXRhdHMgd2l0aGluIFwiKTtfLmIoXy52KF8uZihcIm51bU1vb3JpbmdzXCIsYyxwLDApKSk7Xy5iKFwiIE1vb3JpbmcgQXJlYVwiKTtpZihfLnMoXy5mKFwibW9vcmluZ1BsdXJhbFwiLGMscCwxKSxjLHAsMCwxMDYyLDEwNjMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5IYWJpdGF0PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5QZXJjZW50IG9mIFRvdGFsIEhhYml0YXQ8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwibW9vcmluZ0RhdGFcIixjLHAsMSksYyxwLDAsMTI0NiwxMzM2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiSGFiVHlwZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiAlPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwhLS0gICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgUGVyY2VudGFnZXMgc2hvd24gcmVwcmVzZW50IHRoZSBwcm9wb3J0aW9uIG9mIGhhYml0YXRzIGF2YWlsYWJsZSBpbiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgQmFyYnVkYSdzIGVudGlyZSAzIG5hdXRpY2FsIG1pbGUgYm91bmRhcnkgY2FwdHVyZWQgd2l0aGluIG1vb3JpbmcgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIGFyZWFzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPiAtLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaGFzTm9OZXRab25lc1wiLGMscCwxKSxjLHAsMCwxNTk1LDIyMTMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkhhYml0YXRzIHdpdGhpbiBcIik7Xy5iKF8udihfLmYoXCJudW1Ob05ldFpvbmVzXCIsYyxwLDApKSk7Xy5iKFwiIE5vIE5ldCBab25lXCIpO2lmKF8ucyhfLmYoXCJub05ldFpvbmVzUGx1cmFsXCIsYyxwLDEpLGMscCwwLDE3MTEsMTcxMixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic1wiKTt9KTtjLnBvcCgpO31fLmIoXCI8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkhhYml0YXQ8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPlBlcmNlbnQgb2YgVG90YWwgSGFiaXRhdDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJub05ldFpvbmVzRGF0YVwiLGMscCwxKSxjLHAsMCwxOTAxLDE5OTEsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJIYWJUeXBlXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJQZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiICU8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8IS0tIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBQZXJjZW50YWdlcyBzaG93biByZXByZXNlbnQgdGhlIHByb3BvcnRpb24gb2YgaGFiaXRhdHMgYXZhaWxhYmxlIGluIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBCYXJidWRhJ3MgZW50aXJlIDMgbmF1dGljYWwgbWlsZSBib3VuZGFyeSBjYXB0dXJlZCB3aXRoaW4gbm8gbmV0IHpvbmVzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPiAtLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0Pk1hcnhhbiBBbmFseXNpczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8c2VsZWN0IGNsYXNzPVxcXCJjaG9zZW5cXFwiIHdpZHRoPVxcXCI0MDBweFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcIm1hcnhhbkFuYWx5c2VzXCIsYyxwLDEpLGMscCwwLDIzNTAsMjQwNSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIDxvcHRpb24gdmFsdWU9XFxcIlwiKTtfLmIoXy52KF8uZChcIi5cIixjLHAsMCkpKTtfLmIoXCJcXFwiPlNjZW5hcmlvIFwiKTtfLmIoXy52KF8uZChcIi5cIixjLHAsMCkpKTtfLmIoXCI8L29wdGlvbj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgPC9zZWxlY3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwic2NlbmFyaW9SZXN1bHRzXFxcIj48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJ2aXpcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcInNjZW5hcmlvRGVzY3JpcHRpb25cXFwiPjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiYXJyYXlPdmVydmlld1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtpZihfLnMoXy5kKFwic2tldGNoQ2xhc3MuZGVsZXRlZFwiLGMscCwxKSxjLHAsMCwyNCwyNzAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcImFsZXJ0IGFsZXJ0LXdhcm5cXFwiIHN0eWxlPVxcXCJtYXJnaW4tYm90dG9tOjEwcHg7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFRoaXMgc2tldGNoIHdhcyBjcmVhdGVkIHVzaW5nIHRoZSBcXFwiXCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIlxcXCIgdGVtcGxhdGUsIHdoaWNoIGlzXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBubyBsb25nZXIgYXZhaWxhYmxlLiBZb3Ugd2lsbCBub3QgYmUgYWJsZSB0byBjb3B5IHRoaXMgc2tldGNoIG9yIG1ha2UgbmV3XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBza2V0Y2hlcyBvZiB0aGlzIHR5cGUuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gc2l6ZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+U2l6ZTwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhhc1NrZXRjaGVzXCIsYyxwLDEpLGMscCwwLDM2Myw4NzQsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGlzIGNvbGxlY3Rpb24gaXMgY29tcG9zZWQgb2YgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJudW1Ta2V0Y2hlc1wiLGMscCwwKSkpO18uYihcIiB6b25lXCIpO2lmKF8ucyhfLmYoXCJza2V0Y2hlc1BsdXJhbFwiLGMscCwxKSxjLHAsMCw0NjgsNDY5LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzXCIpO30pO2MucG9wKCk7fV8uYihcIjwvc3Ryb25nPiBpbiBib3RoIG9jZWFuIGFuZCBsYWdvb24gd2F0ZXJzLiBUaGUgY29sbGVjdGlvbiBpbmNsdWRlcyBhIHRvdGFsIDxlbT5vY2VhbmljPC9lbT4gYXJlYSBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInN1bU9jZWFuQXJlYVwiLGMscCwwKSkpO18uYihcIiBzcXVhcmUgbWlsZXM8L3N0cm9uZz4sIHdoaWNoIHJlcHJlc2VudHMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJzdW1PY2VhblBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIEJhcmJ1ZGEncyB3YXRlcnMuIEl0IGFsc28gaW5jb3Jwb3JhdGVzIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInN1bUxhZ29vbkFyZWFcIixjLHAsMCkpKTtfLmIoXCIgc3F1YXJlIG1pbGVzPC9zdHJvbmc+LCBvciA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInN1bUxhZ29vblBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+LCBvZiB0aGUgdG90YWwgPGVtPmxhZ29vbiBhcmVhPC9lbT4uXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZihfLnMoXy5mKFwiaGFzU2FuY3R1YXJpZXNcIixjLHAsMSksYyxwLDAsOTE0LDE2NTMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGUgY29sbGVjdGlvbiBpbmNsdWRlcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm51bVNhbmN0dWFyaWVzXCIsYyxwLDApKSk7Xy5iKFwiIFwiKTtpZighXy5zKF8uZihcInNhbmN0dWFyaWVzUGx1cmFsXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwic2FuY3R1YXJ5XCIpO307aWYoXy5zKF8uZihcInNhbmN0dWFyaWVzUGx1cmFsXCIsYyxwLDEpLGMscCwwLDEwNjcsMTA3OCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic2FuY3R1YXJpZXNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9zdHJvbmc+IGluIGJvdGggb2NlYW4gYW5kIGxhZ29vbiB3YXRlcnMuIFRoZSBcIik7aWYoIV8ucyhfLmYoXCJzYW5jdHVhcmllc1BsdXJhbFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcInNhbmN0dWFyeVwiKTt9O2lmKF8ucyhfLmYoXCJzYW5jdHVhcmllc1BsdXJhbFwiLGMscCwxKSxjLHAsMCwxMjIyLDEyMzMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInNhbmN0dWFyaWVzXCIpO30pO2MucG9wKCk7fV8uYihcIiBjb250YWluXCIpO2lmKCFfLnMoXy5mKFwic2FuY3R1YXJpZXNQbHVyYWxcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJzXCIpO307Xy5iKFwiIGEgdG90YWwgPGVtPm9jZWFuaWM8L2VtPiBhcmVhIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwic2FuY3R1YXJ5T2NlYW5BcmVhXCIsYyxwLDApKSk7Xy5iKFwiIHNxdWFyZSBtaWxlczwvc3Ryb25nPiwgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIHdoaWNoIHJlcHJlc2VudHMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJzYW5jdHVhcnlPY2VhblBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIEJhcmJ1ZGEncyB3YXRlcnMuIEl0IGFsc28gaW5jbHVkZXMgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwic2FuY3R1YXJ5TGFnb29uQXJlYVwiLGMscCwwKSkpO18uYihcIiBzcXVhcmUgbWlsZXM8L3N0cm9uZz4sIG9yIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwic2FuY3R1YXJ5TGFnb29uUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4sIG9mIHRoZSB0b3RhbCA8ZW0+bGFnb29uIGFyZWE8L2VtPi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKF8ucyhfLmYoXCJoYXNOb05ldFpvbmVzXCIsYyxwLDEpLGMscCwwLDE2OTMsMjMyOSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoZSBjb2xsZWN0aW9uIGluY2x1ZGVzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibnVtTm9OZXRab25lc1wiLGMscCwwKSkpO18uYihcIiBObyBOZXQgWm9uZVwiKTtpZihfLnMoXy5mKFwibm9OZXRab25lc1BsdXJhbFwiLGMscCwxKSxjLHAsMCwxODAyLDE4MDMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9zdHJvbmc+IGluIGJvdGggb2NlYW4gYW5kIGxhZ29vbiB3YXRlcnMuIFRoZSBObyBOZXQgWm9uZVwiKTtpZihfLnMoXy5mKFwibm9OZXRab25lc1BsdXJhbFwiLGMscCwxKSxjLHAsMCwxOTAzLDE5MDQsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9zdHJvbmc+IGNvbnRhaW5cIik7aWYoIV8ucyhfLmYoXCJub05ldFpvbmVzUGx1cmFsXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwic1wiKTt9O18uYihcIiBhIHRvdGFsIDxlbT5vY2VhbmljPC9lbT4gYXJlYSBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm5vTmV0Wm9uZXNPY2VhbkFyZWFcIixjLHAsMCkpKTtfLmIoXCIgc3F1YXJlIG1pbGVzPC9zdHJvbmc+LCB3aGljaCByZXByZXNlbnRzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibm9OZXRab25lc09jZWFuUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgQmFyYnVkYSdzIHdhdGVycy4gSXQgYWxzbyBpbmNsdWRlcyBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJub05ldFpvbmVzTGFnb29uQXJlYVwiLGMscCwwKSkpO18uYihcIiBzcXVhcmUgbWlsZXM8L3N0cm9uZz4sIG9yIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibm9OZXRab25lc0xhZ29vblBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+LCBvZiB0aGUgdG90YWwgPGVtPmxhZ29vbiBhcmVhPC9lbT4uXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZihfLnMoXy5mKFwiaGFzTW9vcmluZ3NcIixjLHAsMSksYyxwLDAsMjM2NiwyOTc4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhlIGNvbGxlY3Rpb24gaW5jbHVkZXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJudW1Nb29yaW5nc1wiLGMscCwwKSkpO18uYihcIiBNb29yaW5nIEFyZWFcIik7aWYoXy5zKF8uZihcIm1vb3JpbmdzUGx1cmFsXCIsYyxwLDEpLGMscCwwLDI0NzIsMjQ3MyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic1wiKTt9KTtjLnBvcCgpO31fLmIoXCI8L3N0cm9uZz4gaW4gYm90aCBvY2VhbiBhbmQgbGFnb29uIHdhdGVycy4gVGhlIE1vb3JpbmcgQXJlYVwiKTtpZihfLnMoXy5mKFwibW9vcmluZ3NQbHVyYWxcIixjLHAsMSksYyxwLDAsMjU3MCwyNTcxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzXCIpO30pO2MucG9wKCk7fV8uYihcIiBjb250YWluXCIpO2lmKCFfLnMoXy5mKFwibW9vcmluZ3NQbHVyYWxcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJzXCIpO307Xy5iKFwiIGEgdG90YWwgPGVtPm9jZWFuaWM8L2VtPiBhcmVhIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibW9vcmluZ3NPY2VhbkFyZWFcIixjLHAsMCkpKTtfLmIoXCIgc3F1YXJlIG1pbGVzPC9zdHJvbmc+LCBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgd2hpY2ggcmVwcmVzZW50cyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm1vb3JpbmdzT2NlYW5QZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiBCYXJidWRhJ3Mgd2F0ZXJzLiBJdCBhbHNvIGluY2x1ZGVzIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm1vb3JpbmdzTGFnb29uQXJlYVwiLGMscCwwKSkpO18uYihcIiBzcXVhcmUgbWlsZXM8L3N0cm9uZz4sIG9yIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibW9vcmluZ3NMYWdvb25QZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiwgb2YgdGhlIHRvdGFsIDxlbT5sYWdvb24gYXJlYTwvZW0+LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoXy5zKF8uZihcImhhc0FxdWFjdWx0dXJlXCIsYyxwLDEpLGMscCwwLDMwMTYsMzY2NCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoZSBjb2xsZWN0aW9uIGluY2x1ZGVzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibnVtQXF1YWN1bHR1cmVcIixjLHAsMCkpKTtfLmIoXCIgQXF1YWN1bHR1cmUgQXJlYVwiKTtpZihfLnMoXy5mKFwiYXF1YWN1bHR1cmVQbHVyYWxcIixjLHAsMSksYyxwLDAsMzEzMiwzMTMzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzXCIpO30pO2MucG9wKCk7fV8uYihcIjwvc3Ryb25nPiBpbiBib3RoIG9jZWFuIGFuZCBsYWdvb24gd2F0ZXJzLiBUaGUgQXF1YWN1bHR1cmUgQXJlYVwiKTtpZihfLnMoXy5mKFwiYXF1YWN1bHR1cmVQbHVyYWxcIixjLHAsMSksYyxwLDAsMzI0MCwzMjQxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzXCIpO30pO2MucG9wKCk7fV8uYihcIiBjb250YWluXCIpO2lmKCFfLnMoXy5mKFwiYXF1YWN1bHR1cmVQbHVyYWxcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJzXCIpO307Xy5iKFwiIGEgdG90YWwgPGVtPm9jZWFuaWM8L2VtPiBhcmVhIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiYXF1YWN1bHR1cmVPY2VhbkFyZWFcIixjLHAsMCkpKTtfLmIoXCIgc3F1YXJlIG1pbGVzPC9zdHJvbmc+LCB3aGljaCByZXByZXNlbnRzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiYXF1YWN1bHR1cmVPY2VhblBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIEJhcmJ1ZGEncyB3YXRlcnMuIEl0IGFsc28gaW5jbHVkZXMgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiYXF1YWN1bHR1cmVMYWdvb25BcmVhXCIsYyxwLDApKSk7Xy5iKFwiIHNxdWFyZSBtaWxlczwvc3Ryb25nPiwgb3IgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJhcXVhY3VsdHVyZUxhZ29vblBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+LCBvZiB0aGUgdG90YWwgPGVtPmxhZ29vbiBhcmVhPC9lbT4uXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZihfLnMoXy5mKFwiaGFzRmlzaGluZ0FyZWFzXCIsYyxwLDEpLGMscCwwLDM3MDYsNDM3NSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoZSBjb2xsZWN0aW9uIGluY2x1ZGVzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibnVtRmlzaGluZ0FyZWFzXCIsYyxwLDApKSk7Xy5iKFwiIEZpc2hpbmcgUHJpb3JpdHkgQXJlYVwiKTtpZihfLnMoXy5mKFwiZmlzaGluZ0FyZWFzUGx1cmFsXCIsYyxwLDEpLGMscCwwLDM4MjksMzgzMCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic1wiKTt9KTtjLnBvcCgpO31fLmIoXCI8L3N0cm9uZz4gaW4gYm90aCBvY2VhbiBhbmQgbGFnb29uIHdhdGVycy4gVGhlIEZpc2hpbmcgUHJpb3JpdHkgQXJlYVwiKTtpZihfLnMoXy5mKFwiZmlzaGluZ0FyZWFzUGx1cmFsXCIsYyxwLDEpLGMscCwwLDM5NDQsMzk0NSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic1wiKTt9KTtjLnBvcCgpO31fLmIoXCIgY29udGFpblwiKTtpZighXy5zKF8uZihcImZpc2hpbmdBcmVhc1BsdXJhbFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcInNcIik7fTtfLmIoXCIgYSB0b3RhbCA8ZW0+b2NlYW5pYzwvZW0+IGFyZWEgb2YgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJmaXNoaW5nQXJlYXNPY2VhbkFyZWFcIixjLHAsMCkpKTtfLmIoXCIgc3F1YXJlIG1pbGVzPC9zdHJvbmc+LCB3aGljaCByZXByZXNlbnRzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiZmlzaGluZ0FyZWFzT2NlYW5QZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiBCYXJidWRhJ3Mgd2F0ZXJzLiBJdCBhbHNvIGluY2x1ZGVzIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImZpc2hpbmdBcmVhc0xhZ29vbkFyZWFcIixjLHAsMCkpKTtfLmIoXCIgc3F1YXJlIG1pbGVzPC9zdHJvbmc+LCBvciA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImZpc2hpbmdBcmVhc0xhZ29vblBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+LCBvZiB0aGUgdG90YWwgPGVtPmxhZ29vbiBhcmVhPC9lbT4uXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8IS0tXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+Wm9uZXMgaW4gdGhpcyBQcm9wb3NhbDwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJ0b2NDb250YWluZXJcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIi0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJhbnlBdHRyaWJ1dGVzXCIsYyxwLDEpLGMscCwwLDQ1MzQsNDY1OCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+XCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIiBBdHRyaWJ1dGVzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXy5ycChcImF0dHJpYnV0ZXMvYXR0cmlidXRlc1RhYmxlXCIsYyxwLFwiICBcIikpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fXJldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcImFycmF5VHJhZGVvZmZzXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlRyYWRlb2ZmczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdDxwIGNsYXNzPVxcXCJsYXJnZVxcXCIgc3R5bGU9XFxcIm1hcmdpbi1sZWZ0OjE1cHg7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0XHQ8YSBocmVmID0gXFxcImh0dHA6Ly9tY2NsaW50b2NrLm1zaS51Y3NiLmVkdS9ibG9nL3RyYWRlb2ZmLWFuYWx5c2VzLWluLXNlYXNrZXRjaFxcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPlRyYWRlb2ZmIEFuYWx5c2lzPC9hPiBleGFtaW5lcyB0aGUgaW1wYWN0IG9mIGxvYnN0ZXIgYW5kIGNvbmNoIGZpc2hpbmcgb24gcmVsYXRpdmUgZWNvbG9naWNhbCBhbmQgZmlzaGluZyB2YWx1ZXMuIFByZXZlbnRpbmcgZmlzaGluZyBpbiBhbiBhcmVhIGdlbmVyYWxseVwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgXHRcdGluY3JlYXNlcyB0aGUgZWNvbG9naWNhbCBzY29yZSBieSByZWR1Y2luZyBpbXBhY3RzIGFuZCBkZWNyZWFzZXMgZmlzaGluZyB2YWx1ZXMgYnkgcmVkdWNpbmcgZmlzaGluZyB0YWtlLiBTdG9wcGluZyBmaXNoaW5nIGluIHNvbWUgYXJlYXMsIHN1Y2ggYXMgbnVyc2VyeSBncm91bmRzLCBjYW5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0XHRpbmNyZWFzZSBib3RoIHNjb3JlcyBieSByZWR1Y2luZyBlY29sb2dpY2FsIGltcGFjdHMgYW5kIGluY3JlYXNpbmcgZmlzaCBzdG9ja3MuIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgXHQ8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQ8cCBjbGFzcz1cXFwic21hbGwgdHRpcC10aXBcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgVGlwOiBob3ZlciBvdmVyIGEgcHJvcG9zYWwgdG8gc2VlIGRldGFpbHNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0PGRpdiAgaWQ9XFxcInRyYWRlb2ZmLWNoYXJ0XFxcIiBjbGFzcz1cXFwidHJhZGVvZmYtY2hhcnRcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJkZW1vXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlJlcG9ydCBTZWN0aW9uczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5Vc2UgcmVwb3J0IHNlY3Rpb25zIHRvIGdyb3VwIGluZm9ybWF0aW9uIGludG8gbWVhbmluZ2Z1bCBjYXRlZ29yaWVzPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RDMgVmlzdWFsaXphdGlvbnM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHVsIGNsYXNzPVxcXCJuYXYgbmF2LXBpbGxzXFxcIiBpZD1cXFwidGFiczJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8bGkgY2xhc3M9XFxcImFjdGl2ZVxcXCI+PGEgaHJlZj1cXFwiI2NoYXJ0XFxcIj5DaGFydDwvYT48L2xpPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8bGk+PGEgaHJlZj1cXFwiI2RhdGFUYWJsZVxcXCI+VGFibGU8L2E+PC9saT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdWw+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJ0YWItY29udGVudFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcInRhYi1wYW5lIGFjdGl2ZVxcXCIgaWQ9XFxcImNoYXJ0XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8IS0tW2lmIElFIDhdPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxwIGNsYXNzPVxcXCJ1bnN1cHBvcnRlZFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgVGhpcyB2aXN1YWxpemF0aW9uIGlzIG5vdCBjb21wYXRpYmxlIHdpdGggSW50ZXJuZXQgRXhwbG9yZXIgOC4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgUGxlYXNlIHVwZ3JhZGUgeW91ciBicm93c2VyLCBvciB2aWV3IHJlc3VsdHMgaW4gdGhlIHRhYmxlIHRhYi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3A+ICAgICAgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPCFbZW5kaWZdLS0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBTZWUgPGNvZGU+c3JjL3NjcmlwdHMvZGVtby5jb2ZmZWU8L2NvZGU+IGZvciBhbiBleGFtcGxlIG9mIGhvdyB0byBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIHVzZSBkMy5qcyB0byByZW5kZXIgdmlzdWFsaXphdGlvbnMuIFByb3ZpZGUgYSB0YWJsZS1iYXNlZCB2aWV3XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBhbmQgdXNlIGNvbmRpdGlvbmFsIGNvbW1lbnRzIHRvIHByb3ZpZGUgYSBmYWxsYmFjayBmb3IgSUU4IHVzZXJzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPGJyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPGEgaHJlZj1cXFwiaHR0cDovL3R3aXR0ZXIuZ2l0aHViLmlvL2Jvb3RzdHJhcC8yLjMuMi9cXFwiPkJvb3RzdHJhcCAyLng8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBpcyBsb2FkZWQgd2l0aGluIFNlYVNrZXRjaCBzbyB5b3UgY2FuIHVzZSBpdCB0byBjcmVhdGUgdGFicyBhbmQgb3RoZXIgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBpbnRlcmZhY2UgY29tcG9uZW50cy4galF1ZXJ5IGFuZCB1bmRlcnNjb3JlIGFyZSBhbHNvIGF2YWlsYWJsZS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJ0YWItcGFuZVxcXCIgaWQ9XFxcImRhdGFUYWJsZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPmluZGV4PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+dmFsdWU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiY2hhcnREYXRhXCIsYyxwLDEpLGMscCwwLDEzNTEsMTQxOCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIDx0cj48dGQ+XCIpO18uYihfLnYoXy5mKFwiaW5kZXhcIixjLHAsMCkpKTtfLmIoXCI8L3RkPjx0ZD5cIik7Xy5iKF8udihfLmYoXCJ2YWx1ZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+PC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiBlbXBoYXNpc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RW1waGFzaXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+R2l2ZSByZXBvcnQgc2VjdGlvbnMgYW4gPGNvZGU+ZW1waGFzaXM8L2NvZGU+IGNsYXNzIHRvIGhpZ2hsaWdodCBpbXBvcnRhbnQgaW5mb3JtYXRpb24uPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB3YXJuaW5nXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5XYXJuaW5nPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPk9yIDxjb2RlPndhcm48L2NvZGU+IG9mIHBvdGVudGlhbCBwcm9ibGVtcy48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIGRhbmdlclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RGFuZ2VyPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPjxjb2RlPmRhbmdlcjwvY29kZT4gY2FuIGFsc28gYmUgdXNlZC4uLiBzcGFyaW5nbHkuPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJmaXNoaW5nUHJpb3JpdHlBcmVhXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkZpc2hpbmcgVmFsdWU8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhpcyBmaXNoaW5nIHByaW9yaXR5IGFyZWEgaW5jbHVkZXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJwZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiB0aGUgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIGZpc2hpbmcgdmFsdWUgd2l0aGluIEJhcmJ1ZGEncyB3YXRlcnMsIGJhc2VkIG9uIHVzZXIgcmVwb3J0ZWQgdmFsdWVzIG9mIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBmaXNoaW5nIGdyb3VuZHNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjUzM2YxNmY2YTQ5ODg2N2M1NmM2ZmI1N1xcXCI+c2hvdyBmaXNoaW5nIHZhbHVlcyBsYXllcjwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcImZpc2hpbmdWYWx1ZVwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5GaXNoaW5nIFZhbHVlPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoaXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJhcmVhTGFiZWxcIixjLHAsMCkpKTtfLmIoXCI8L3N0cm9uZz4gXCIpO2lmKF8ucyhfLmYoXCJpc01vb3JpbmdBcmVhXCIsYyxwLDEpLGMscCwwLDEzMSwxNTQsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIm1heSBvciBtYXkgbm90IGRpc3BsYWNlXCIpO30pO2MucG9wKCk7fV8uYihcIiBcIik7aWYoIV8ucyhfLmYoXCJpc01vb3JpbmdBcmVhXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiZGlzcGxhY2VzXCIpO307Xy5iKFwiIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwicGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIG9mIHRoZSBmaXNoaW5nIHZhbHVlIHdpdGhpbiBCYXJidWRh4oCZcyB3YXRlcnMsIGJhc2VkIG9uIHVzZXIgcmVwb3J0ZWRcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgdmFsdWVzIG9mIGZpc2hpbmcgZ3JvdW5kcy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjUzM2YxNmY2YTQ5ODg2N2M1NmM2ZmI1N1xcXCI+c2hvdyBmaXNoaW5nIHZhbHVlcyBsYXllcjwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcImhhYml0YXRcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+XCIpO18uYihfLnYoXy5mKFwiaGVhZGluZ1wiLGMscCwwKSkpO18uYihcIjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+SGFiaXRhdDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+JSBvZiBUb3RhbCBIYWJpdGF0PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhhYml0YXRzXCIsYyxwLDEpLGMscCwwLDIxNiwyNzksXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0cj48dGQ+XCIpO18uYihfLnYoXy5mKFwiSGFiVHlwZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+PHRkPlwiKTtfLmIoXy52KF8uZihcIlBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCI8L3RkPjwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgUGVyY2VudGFnZXMgc2hvd24gcmVwcmVzZW50IHRoZSBwcm9wb3J0aW9uIG9mIGhhYml0YXRzIGF2YWlsYWJsZSBpbiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgQmFyYnVkYSdzIGVudGlyZSAzIG5hdXRpY2FsIG1pbGUgYm91bmRhcnkgY2FwdHVyZWQgd2l0aGluIHRoaXMgem9uZS4gPGJyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MzNkZGY4NmE0OTg4NjdjNTZjNmM4MzBcXFwiPnNob3cgaGFiaXRhdHMgbGF5ZXI8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+TWFyeGFuIEFuYWx5c2lzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxzZWxlY3QgY2xhc3M9XFxcImNob3NlblxcXCIgd2lkdGg9XFxcIjQwMHB4XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwibWFyeGFuQW5hbHlzZXNcIixjLHAsMSksYyxwLDAsNjkwLDc0NSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIDxvcHRpb24gdmFsdWU9XFxcIlwiKTtfLmIoXy52KF8uZChcIi5cIixjLHAsMCkpKTtfLmIoXCJcXFwiPlNjZW5hcmlvIFwiKTtfLmIoXy52KF8uZChcIi5cIixjLHAsMCkpKTtfLmIoXCI8L29wdGlvbj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgPC9zZWxlY3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwic2NlbmFyaW9SZXN1bHRzXFxcIj48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJ2aXpcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcInNjZW5hcmlvRGVzY3JpcHRpb25cXFwiPjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm92ZXJ2aWV3XCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO2lmKF8ucyhfLmQoXCJza2V0Y2hDbGFzcy5kZWxldGVkXCIsYyxwLDEpLGMscCwwLDI0LDI3MCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwiYWxlcnQgYWxlcnQtd2FyblxcXCIgc3R5bGU9XFxcIm1hcmdpbi1ib3R0b206MTBweDtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgVGhpcyBza2V0Y2ggd2FzIGNyZWF0ZWQgdXNpbmcgdGhlIFxcXCJcIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiB0ZW1wbGF0ZSwgd2hpY2ggaXNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIG5vIGxvbmdlciBhdmFpbGFibGUuIFlvdSB3aWxsIG5vdCBiZSBhYmxlIHRvIGNvcHkgdGhpcyBza2V0Y2ggb3IgbWFrZSBuZXdcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIHNrZXRjaGVzIG9mIHRoaXMgdHlwZS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiBzaXplXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5TaXplPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoaXMgYXJlYSBpcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIlNRX01JTEVTXCIsYyxwLDApKSk7Xy5iKFwiIHNxdWFyZSBtaWxlczwvc3Ryb25nPixcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgd2hpY2ggcmVwcmVzZW50cyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIlBFUkNFTlRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIEJhcmJ1ZGEncyB3YXRlcnMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwicmVuZGVyTWluaW11bVdpZHRoXCIsYyxwLDEpLGMscCwwLDUzNiwxMTc4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIGRpYW1ldGVyIFwiKTtpZighXy5zKF8uZihcIkRJQU1fT0tcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJ3YXJuaW5nXCIpO307Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5NaW5pbXVtIFdpZHRoPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoZSBtaW5pbXVtIHdpZHRoIG9mIGEgem9uZSBzaWduaWZpY2FudGx5IGltcGFjdHMgIGl0cyBjb25zZXJ2YXRpb24gdmFsdWUuIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGUgcmVjb21tZW5kZWQgc21hbGxlc3QgZGlhbWV0ZXIgaXMgYmV0d2VlbiAyIGFuZCAzIG1pbGVzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8c3Ryb25nPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKCFfLnMoXy5mKFwiRElBTV9PS1wiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgICBUaGlzIGRlc2lnbiBmYWxscyBvdXRzaWRlIHRoZSByZWNvbW1lbmRhdGlvbiBhdCBcIik7Xy5iKF8udihfLmYoXCJESUFNXCIsYyxwLDApKSk7Xy5iKFwiIG1pbGVzLlwiKTtfLmIoXCJcXG5cIik7fTtpZihfLnMoXy5mKFwiRElBTV9PS1wiLGMscCwxKSxjLHAsMCw5MjYsOTk3LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgVGhpcyBkZXNpZ24gZml0cyB3aXRoaW4gdGhlIHJlY29tbWVuZGF0aW9uIGF0IFwiKTtfLmIoXy52KF8uZihcIkRJQU1cIixjLHAsMCkpKTtfLmIoXCIgbWlsZXMuXCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC9zdHJvbmc+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJ2aXpcXFwiIHN0eWxlPVxcXCJwb3NpdGlvbjpyZWxhdGl2ZTtcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGltZyBzcmM9XFxcImh0dHA6Ly9zMy5hbWF6b25hd3MuY29tL1NlYVNrZXRjaC9wcm9qZWN0cy9iYXJidWRhL21pbl93aWR0aF9leGFtcGxlLnBuZ1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJhbnlBdHRyaWJ1dGVzXCIsYyxwLDEpLGMscCwwLDEyMjEsMTM0NSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+XCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIiBBdHRyaWJ1dGVzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXy5ycChcImF0dHJpYnV0ZXMvYXR0cmlidXRlc1RhYmxlXCIsYyxwLFwiICBcIikpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fXJldHVybiBfLmZsKCk7O30pO1xuXG5pZih0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gdGhpc1tcIlRlbXBsYXRlc1wiXTtcbn0iXX0=
