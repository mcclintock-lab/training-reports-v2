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


},{}],"api/utils":[function(require,module,exports){
module.exports=require('+VosKh');
},{}],"CNqB+b":[function(require,module,exports){
this["Templates"] = this["Templates"] || {};

this["Templates"]["node_modules/seasketch-reporting-api/attributes/attributeItem"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<tr data-attribute-id=\"");_.b(_.v(_.f("id",c,p,0)));_.b("\" data-attribute-exportid=\"");_.b(_.v(_.f("exportid",c,p,0)));_.b("\" data-attribute-type=\"");_.b(_.v(_.f("type",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <td class=\"name\">");_.b(_.v(_.f("name",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("  <td class=\"value\">");_.b(_.v(_.f("formattedValue",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("</tr>");_.b("\n");return _.fl();;});

this["Templates"]["node_modules/seasketch-reporting-api/attributes/attributesTable"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<table class=\"attributes\">");_.b("\n" + i);if(_.s(_.f("attributes",c,p,1),c,p,0,44,81,"{{ }}")){_.rs(c,p,function(c,p,_){_.b(_.rp("attributes/attributeItem",c,p,"    "));});c.pop();}_.b("</table>");_.b("\n");return _.fl();;});

this["Templates"]["node_modules/seasketch-reporting-api/genericAttributes"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" Attributes</h4>");_.b("\n" + i);_.b(_.rp("attributes/attributesTable",c,p,"    "));_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

this["Templates"]["node_modules/seasketch-reporting-api/reportLoading"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportLoading\">");_.b("\n" + i);_.b("  <!-- <div class=\"spinner\">3</div> -->");_.b("\n" + i);_.b("  <h4>Requesting Report from Server</h4>");_.b("\n" + i);_.b("  <div class=\"progress progress-striped active\">");_.b("\n" + i);_.b("    <div class=\"bar\" style=\"width: 100%;\"></div>");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("  <a href=\"#\" rel=\"details\">details</a>");_.b("\n" + i);_.b("    <div class=\"details\">");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

module.exports = this["Templates"];
},{}],"api/templates":[function(require,module,exports){
module.exports=require('CNqB+b');
},{}],11:[function(require,module,exports){
var ArrayFishingValueTab, ReportTab, ids, key, templates, value, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('reportTab');

templates = require('../templates/templates.js');

ids = require('./ids.coffee');

for (key in ids) {
  value = ids[key];
  window[key] = value;
}

ArrayFishingValueTab = (function(_super) {
  __extends(ArrayFishingValueTab, _super);

  function ArrayFishingValueTab() {
    _ref = ArrayFishingValueTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  ArrayFishingValueTab.prototype.name = 'Fishing Value';

  ArrayFishingValueTab.prototype.className = 'fishingValue';

  ArrayFishingValueTab.prototype.template = templates.arrayFishingValue;

  ArrayFishingValueTab.prototype.dependencies = ['FishingValue'];

  ArrayFishingValueTab.prototype.timeout = 240000;

  ArrayFishingValueTab.prototype.render = function() {
    var context, mooringPercent, moorings, noNetZones, noNetZonesPercent, numTypes, sanctuaries, sanctuaryPercent, shippingZones, shippingZonesPercent;
    numTypes = 0;
    sanctuaries = this.getChildren(SANCTUARY_ID);
    if (sanctuaries.length) {
      sanctuaryPercent = this.recordSet('FishingValue', 'FishingValue', SANCTUARY_ID).float('PERCENT', 2);
    }
    moorings = this.getChildren(MOORING_ID);
    if (moorings.length) {
      mooringPercent = this.recordSet('FishingValue', 'FishingValue', MOORING_ID).float('PERCENT', 2);
    }
    noNetZones = this.getChildren(NO_NET_ZONES_ID);
    if (noNetZones.length) {
      noNetZonesPercent = this.recordSet('FishingValue', 'FishingValue', NO_NET_ZONES_ID).float('PERCENT', 0);
    }
    shippingZones = this.getChildren(SHIPPING_ZONE_ID);
    if (shippingZones.length) {
      shippingZonesPercent = this.recordSet('FishingValue', 'FishingValue', SHIPPING_ZONE_ID).float('PERCENT', 0);
    }
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user),
      sanctuaryPercent: sanctuaryPercent,
      numSanctuaries: sanctuaries.length,
      hasSanctuaries: (sanctuaries != null ? sanctuaries.length : void 0) > 0,
      sancPlural: (sanctuaries != null ? sanctuaries.length : void 0) > 1,
      mooringsPercent: mooringPercent,
      numMoorings: moorings != null ? moorings.length : void 0,
      hasMoorings: (moorings != null ? moorings.length : void 0) > 0,
      mooringsPlural: (moorings != null ? moorings.length : void 0) > 1,
      noNetZonesPercent: noNetZonesPercent,
      numNoNetZones: noNetZones != null ? noNetZones.length : void 0,
      hasNoNetZones: (noNetZones != null ? noNetZones.length : void 0) > 0,
      noNetZonesPlural: (noNetZones != null ? noNetZones.length : void 0) > 1,
      shippingZonesPercent: shippingZonesPercent,
      numShippingZones: shippingZones != null ? shippingZones.length : void 0,
      hasShippingZones: (shippingZones != null ? shippingZones.length : void 0) > 0,
      shippingZonesPlural: (shippingZones != null ? shippingZones.length : void 0) > 1
    };
    this.$el.html(this.template.render(context, templates));
    return this.enableLayerTogglers(this.$el);
  };

  return ArrayFishingValueTab;

})(ReportTab);

module.exports = ArrayFishingValueTab;


},{"../templates/templates.js":17,"./ids.coffee":15,"reportTab":"a21iR2"}],12:[function(require,module,exports){
var ArrayHabitatTab, ReportTab, ids, key, templates, value, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

ReportTab = require('reportTab');

templates = require('../templates/templates.js');

ids = require('./ids.coffee');

for (key in ids) {
  value = ids[key];
  window[key] = value;
}

ArrayHabitatTab = (function(_super) {
  __extends(ArrayHabitatTab, _super);

  function ArrayHabitatTab() {
    this.renderMarxanAnalysis = __bind(this.renderMarxanAnalysis, this);
    _ref = ArrayHabitatTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  ArrayHabitatTab.prototype.name = 'Habitat';

  ArrayHabitatTab.prototype.className = 'habitat';

  ArrayHabitatTab.prototype.template = templates.arrayHabitats;

  ArrayHabitatTab.prototype.dependencies = ['BarbudaHabitat', 'MarxanAnalysis'];

  ArrayHabitatTab.prototype.timeout = 240000;

  ArrayHabitatTab.prototype.render = function() {
    var context, data, mooringData, moorings, noNetZones, noNetZonesData, row, sanctuaries, sanctuary, _i, _len,
      _this = this;
    data = this.recordSet('MarxanAnalysis', 'MarxanAnalysis').toArray();
    sanctuaries = this.getChildren(SANCTUARY_ID);
    if (sanctuaries.length) {
      sanctuary = this.recordSet('BarbudaHabitat', 'Habitats', SANCTUARY_ID).toArray();
      for (_i = 0, _len = sanctuary.length; _i < _len; _i++) {
        row = sanctuary[_i];
        if (parseFloat(row.Percent) >= 33) {
          row.meetsGoal = true;
        }
      }
    }
    moorings = this.getChildren(MOORING_ID);
    if (moorings.length) {
      mooringData = this.recordSet('BarbudaHabitat', 'Habitats', MOORING_ID).toArray();
    }
    noNetZones = this.getChildren(NO_NET_ZONES_ID);
    if (noNetZones.length) {
      noNetZonesData = this.recordSet('BarbudaHabitat', 'Habitats', NO_NET_ZONES_ID).toArray();
    }
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user),
      numSanctuaries: sanctuaries.length,
      sanctuaries: sanctuaries.length > 0,
      sanctuaryHabitat: sanctuary,
      sanctuaryPlural: sanctuaries.length > 1,
      moorings: moorings.length > 0,
      numMoorings: moorings.length,
      mooringData: mooringData,
      mooringPlural: moorings.length > 1,
      hasNoNetZones: noNetZones.length > 0,
      numNoNetZones: noNetZones.length,
      noNetZonesData: noNetZonesData,
      noNetZonesPlural: noNetZones.length > 1,
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

  ArrayHabitatTab.prototype.renderMarxanAnalysis = function() {
    var color, curr_proposal, curr_score, data, domain, e, el, height, histo, i, isVisible, margin, max_q, min_q, name, node, nodeId, nodeMap, p, pname, prop_ids, proposals, q, quantile, quantile_desc, quantile_range, quantiles, rec, records, scenarioName, score_map, scores, scores_data, sdata, svg, toc, view, width, x, xAxis, y, yAxis, yoffset, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref1;
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
      scores_data = [];
      for (_i = 0, _len = records.length; _i < _len; _i++) {
        rec = records[_i];
        if (rec.NAME === name) {
          scores_data.push(rec);
        }
      }
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
      for (i = _j = 0, _len1 = quantiles.length; _j < _len1; i = ++_j) {
        q = quantiles[i];
        if (parseFloat(data[q]) > parseFloat(data.SCORE) || i === quantiles.length - 1) {
          max_q = quantiles[i];
          min_q = quantiles[i - 1] || "Q0";
          quantile_desc = quantile_range[min_q];
          break;
        }
      }
      this.$('.scenarioResults').html("<a href=\"http://www.uq.edu.au/marxan/\" target=\"_blank\" >Marxan</a> is conservation planning software that provides decision support for a range of conservation planning problems. \nIn this analysis, the goal is to maximize the amount of habitat conserved. The score for a 200 square meter planning unit is the number of times it is selected in 100 runs, \nwith higher scores indicating greater conservation value. The average Marxan score for this collection is <strong>" + data.SCORE + "</strong>, placing it in \nthe <strong>" + quantile_desc + "</strong> quantile range <strong>(" + (min_q.replace('Q', '')) + "% - " + (max_q.replace('Q', '')) + "%)</strong> \nfor this region. The graph below shows the distribution of scores for all planning units within this project.");
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
      height = 350 - margin.top - margin.bottom;
      x = d3.scale.linear().domain([0, 100]).range([0, width]);
      y = d3.scale.linear().range([height, 0]).domain([0, d3.max(histo) + 50]);
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
      score_map = [];
      for (_k = 0, _len2 = scores_data.length; _k < _len2; _k++) {
        sdata = scores_data[_k];
        curr_score = Math.round(sdata.SCORE);
        curr_proposal = sdata.PROPOSAL;
        scores = Object.keys(score_map);
        if (_ref1 = curr_score.toString(), __indexOf.call(scores, _ref1) >= 0) {
          prop_ids = score_map[curr_score];
          prop_ids.push(curr_proposal);
          score_map[curr_score] = prop_ids;
        } else {
          score_map[curr_score] = [curr_proposal];
        }
      }
      for (sdata in score_map) {
        proposals = score_map[sdata];
        svg.selectAll(".score" + sdata).data([sdata]).enter().append("text").attr("class", "score").attr("x", function(d) {
          return (x(d) - 8) + 'px';
        }).attr("y", function(d) {
          return (y(histo[d]) - 1) + 'px';
        }).text("▼");
      }
      for (sdata in score_map) {
        proposals = score_map[sdata];
        if (proposals.length === 1) {
          pname = window.app.sketches.get(proposals[0]).attributes.name;
          svg.selectAll(".scoreText" + sdata).data([sdata]).enter().append("text").attr("class", "scoreText").attr("x", function(d) {
            return (x(d) - 6) + 'px';
          }).attr("y", function(d) {
            return (y(histo[d]) - 18) + 'px';
          }).text(function(d) {
            return d + ": " + pname;
          });
        } else {
          yoffset = -18;
          for (_l = 0, _len3 = proposals.length; _l < _len3; _l++) {
            p = proposals[_l];
            pname = window.app.sketches.get(p).attributes.name;
            if (yoffset === -18) {
              svg.selectAll(".scoreText" + sdata + p).data([sdata]).enter().append("text").attr("class", "scoreText").attr("x", function(d) {
                return (x(d) - 6) + 'px';
              }).attr("y", function(d) {
                return (y(histo[d]) + yoffset) + 'px';
              }).text(function(d) {
                return "Proposals with score " + d + ":";
              });
            }
            yoffset += 12;
            svg.selectAll(".scoreText" + p).data([sdata]).enter().append("text").attr("class", "scoreText").attr("x", function(d) {
              return (x(d) + 10) + 'px';
            }).attr("y", function(d) {
              return (y(histo[d]) + yoffset) + 'px';
            }).text(function(d) {
              return pname;
            });
            yoffset += 1;
          }
        }
      }
      this.$('.viz').append('<div class="legends"></div>');
      for (_m = 0, _len4 = quantiles.length; _m < _len4; _m++) {
        quantile = quantiles[_m];
        this.$('.viz .legends').append("<div class=\"legend\"><span style=\"background-color:" + quantile.bg + ";\">&nbsp;</span>" + quantile.range + "</div>");
      }
      return this.$('.viz').append('<br style="clear:both;">');
    }
  };

  return ArrayHabitatTab;

})(ReportTab);

module.exports = ArrayHabitatTab;


},{"../templates/templates.js":17,"./ids.coffee":15,"reportTab":"a21iR2"}],13:[function(require,module,exports){
var ArrayOverviewTab, ReportTab, TOTAL_AREA, TOTAL_LAGOON_AREA, ids, key, partials, round, templates, val, value, _partials, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('reportTab');

templates = require('../templates/templates.js');

ids = require('./ids.coffee');

for (key in ids) {
  value = ids[key];
  window[key] = value;
}

round = require('api/utils').round;

TOTAL_AREA = 164.8;

TOTAL_LAGOON_AREA = 11.1;

_partials = require('api/templates');

partials = [];

for (key in _partials) {
  val = _partials[key];
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val;
}

ArrayOverviewTab = (function(_super) {
  __extends(ArrayOverviewTab, _super);

  function ArrayOverviewTab() {
    _ref = ArrayOverviewTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  ArrayOverviewTab.prototype.name = 'Overview';

  ArrayOverviewTab.prototype.className = 'overview';

  ArrayOverviewTab.prototype.template = templates.arrayOverview;

  ArrayOverviewTab.prototype.dependencies = ['Diameter'];

  ArrayOverviewTab.prototype.timeout = 120000;

  ArrayOverviewTab.prototype.render = function() {
    var aquacultureAreas, aquacultureLagoonArea, aquacultureLagoonPercent, aquacultureOceanArea, aquacultureOceanPercent, context, fishingAreas, hasSketches, moorings, mooringsLagoonArea, mooringsLagoonPercent, mooringsOceanArea, mooringsOceanPercent, noNetZones, noNetZonesLagoonArea, noNetZonesLagoonPercent, noNetZonesOceanArea, noNetZonesOceanPercent, numAquacultureAreas, numMoorings, numNoNetZones, numSanctuaries, numTotalZones, sanctuaries, sanctuaryLagoonArea, sanctuaryLagoonPercent, sanctuaryOceanArea, sanctuaryOceanPercent, sumLagoonArea, sumLagoonPercent, sumOceanArea, sumOceanPercent;
    sanctuaries = [];
    aquacultureAreas = [];
    moorings = [];
    noNetZones = [];
    fishingAreas = [];
    sanctuaries = this.getChildren(SANCTUARY_ID);
    numSanctuaries = sanctuaries.length;
    if (numSanctuaries > 0) {
      sanctuaryOceanArea = this.recordSet('Diameter', 'Diameter', SANCTUARY_ID).float('OCEAN_AREA', 1);
      sanctuaryLagoonArea = this.recordSet('Diameter', 'Diameter', SANCTUARY_ID).float('LAGOON_AREA', 1);
      sanctuaryOceanPercent = this.recordSet('Diameter', 'Diameter', SANCTUARY_ID).float('OCEAN_PERCENT', 1);
      sanctuaryLagoonPercent = this.recordSet('Diameter', 'Diameter', SANCTUARY_ID).float('LAGOON_PERCENT', 1);
    } else {
      sanctuaryOceanArea = 0;
      sanctuaryOceanPercent = 0.0;
      sanctuaryLagoonArea = 0;
      sanctuaryLagoonPercent = 0.0;
    }
    aquacultureAreas = this.getChildren(AQUACULTURE_ID);
    numAquacultureAreas = aquacultureAreas.length;
    if (numAquacultureAreas > 0) {
      aquacultureOceanArea = this.recordSet('Diameter', 'Diameter', AQUACULTURE_ID).float('OCEAN_AREA', 1);
      aquacultureLagoonArea = this.recordSet('Diameter', 'Diameter', AQUACULTURE_ID).float('LAGOON_AREA', 1);
      aquacultureOceanPercent = this.recordSet('Diameter', 'Diameter', AQUACULTURE_ID).float('OCEAN_PERCENT', 1);
      aquacultureLagoonPercent = this.recordSet('Diameter', 'Diameter', AQUACULTURE_ID).float('LAGOON_PERCENT', 1);
    } else {
      aquacultureOceanArea = 0;
      aquacultureOceanPercent = 0.0;
      aquacultureLagoonArea = 0;
      aquacultureLagoonPercent = 0.0;
    }
    moorings = this.getChildren(MOORING_ID);
    numMoorings = moorings.length;
    if (numMoorings > 0) {
      mooringsOceanArea = this.recordSet('Diameter', 'Diameter', MOORING_ID).float('OCEAN_AREA', 1);
      mooringsLagoonArea = this.recordSet('Diameter', 'Diameter', MOORING_ID).float('LAGOON_AREA', 1);
      mooringsOceanPercent = this.recordSet('Diameter', 'Diameter', MOORING_ID).float('OCEAN_PERCENT', 1);
      mooringsLagoonPercent = this.recordSet('Diameter', 'Diameter', MOORING_ID).float('LAGOON_PERCENT', 1);
    } else {
      mooringsOceanArea = 0;
      mooringsOceanPercent = 0.0;
      mooringsLagoonArea = 0;
      mooringsLagoonPercent = 0.0;
    }
    noNetZones = this.getChildren(NO_NET_ZONES_ID);
    numNoNetZones = noNetZones.length;
    if (numNoNetZones > 0) {
      noNetZonesOceanArea = this.recordSet('Diameter', 'Diameter', NO_NET_ZONES_ID).float('OCEAN_AREA', 1);
      noNetZonesLagoonArea = this.recordSet('Diameter', 'Diameter', NO_NET_ZONES_ID).float('LAGOON_AREA', 1);
      noNetZonesOceanPercent = this.recordSet('Diameter', 'Diameter', NO_NET_ZONES_ID).float('OCEAN_PERCENT', 1);
      noNetZonesLagoonPercent = this.recordSet('Diameter', 'Diameter', NO_NET_ZONES_ID).float('LAGOON_PERCENT', 1);
    } else {
      noNetZonesOceanArea = 0;
      noNetZonesOceanPercent = 0.0;
      noNetZonesLagoonArea = 0;
      noNetZonesLagoonPercent = 0.0;
    }
    numTotalZones = numSanctuaries + numNoNetZones + numAquacultureAreas + numMoorings;
    sumOceanArea = round(sanctuaryOceanArea + noNetZonesOceanArea + aquacultureOceanArea + mooringsOceanArea, 1);
    sumOceanPercent = round(sanctuaryOceanPercent + noNetZonesOceanPercent + aquacultureOceanPercent + mooringsOceanPercent, 0);
    sumLagoonArea = round(sanctuaryLagoonArea + noNetZonesLagoonArea + aquacultureLagoonArea + mooringsLagoonArea, 1);
    sumLagoonPercent = round(sanctuaryLagoonPercent + noNetZonesLagoonPercent + aquacultureLagoonPercent + mooringsLagoonPercent, 0);
    hasSketches = numTotalZones > 0;
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      anyAttributes: this.model.getAttributes().length > 0,
      admin: this.project.isAdmin(window.user),
      numSanctuaries: sanctuaries.length,
      hasSanctuaries: sanctuaries.length > 0,
      sanctuariesPlural: sanctuaries.length > 1,
      sanctuaryOceanPercent: round(sanctuaryOceanPercent, 2),
      sanctuaryOceanArea: round(sanctuaryOceanArea, 1),
      sanctuaryLagoonArea: round(sanctuaryLagoonArea, 2),
      sanctuaryLagoonPercent: round(sanctuaryLagoonPercent, 1),
      numNoNetZones: noNetZones.length,
      hasNoNetZones: noNetZones.length > 0,
      noNetZonesPlural: noNetZones.length > 1,
      noNetZonesOceanPercent: round(noNetZonesOceanPercent, 2),
      noNetZonesOceanArea: round(noNetZonesOceanArea, 1),
      noNetZonesLagoonArea: round(noNetZonesLagoonArea, 2),
      noNetZonesLagoonPercent: round(noNetZonesLagoonPercent, 1),
      numAquaculture: aquacultureAreas.length,
      hasAquaculture: aquacultureAreas.length > 0,
      aquaculturePlural: aquacultureAreas.length > 1,
      aquacultureOceanPercent: round(aquacultureOceanPercent, 2),
      aquacultureOceanArea: round(aquacultureOceanArea, 1),
      aquacultureLagoonArea: round(aquacultureLagoonArea, 2),
      aquacultureLagoonPercent: round(aquacultureLagoonPercent, 1),
      numMoorings: moorings.length,
      hasMoorings: moorings.length > 0,
      mooringsPlural: moorings.length > 1,
      mooringsOceanPercent: round(mooringsOceanPercent, 2),
      mooringsOceanArea: round(mooringsOceanArea, 1),
      mooringsLagoonArea: round(mooringsLagoonArea, 2),
      mooringsLagoonPercent: round(mooringsLagoonPercent, 1),
      hasSketches: hasSketches,
      sketchesPlural: numTotalZones > 1,
      numSketches: numTotalZones,
      sumOceanArea: sumOceanArea,
      sumOceanPercent: sumOceanPercent,
      sumLagoonPercent: sumLagoonPercent,
      sumLagoonArea: sumLagoonArea
    };
    return this.$el.html(this.template.render(context, partials));
  };

  ArrayOverviewTab.prototype.remove = function() {
    var _ref1;
    if ((_ref1 = this.toc) != null) {
      _ref1.remove();
    }
    return ArrayOverviewTab.__super__.remove.call(this);
  };

  return ArrayOverviewTab;

})(ReportTab);

module.exports = ArrayOverviewTab;


},{"../templates/templates.js":17,"./ids.coffee":15,"api/templates":"CNqB+b","api/utils":"+VosKh","reportTab":"a21iR2"}],14:[function(require,module,exports){
var ArrayTradeoffsTab, ReportTab, TOTAL_AREA, TOTAL_LAGOON_AREA, key, partials, round, templates, val, _partials, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('reportTab');

templates = require('../templates/templates.js');

round = require('api/utils').round;

TOTAL_AREA = 164.8;

TOTAL_LAGOON_AREA = 11.1;

_partials = require('api/templates');

partials = [];

for (key in _partials) {
  val = _partials[key];
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val;
}

ArrayTradeoffsTab = (function(_super) {
  var calc_ttip, formatAxis, getColors, getStrokeColor;

  __extends(ArrayTradeoffsTab, _super);

  function ArrayTradeoffsTab() {
    this.scatterplot = __bind(this.scatterplot, this);
    _ref = ArrayTradeoffsTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  ArrayTradeoffsTab.prototype.name = 'Tradeoffs';

  ArrayTradeoffsTab.prototype.className = 'tradeoffs';

  ArrayTradeoffsTab.prototype.template = templates.arrayTradeoffs;

  ArrayTradeoffsTab.prototype.dependencies = ['TradeoffsPropId'];

  ArrayTradeoffsTab.prototype.timeout = 120000;

  ArrayTradeoffsTab.prototype.render = function() {
    var ch, context, h, halfh, halfw, margin, mychart, tooltip, totalh, totalw, tradeoff_data, w;
    tradeoff_data = this.recordSet('TradeoffsPropId', 'TradeoffsPropId').toArray();
    console.log("tradeoff data: ", tradeoff_data);
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user)
    };
    this.$el.html(this.template.render(context, partials));
    if (window.d3) {
      h = 380;
      w = 380;
      margin = {
        left: 40,
        top: 5,
        right: 40,
        bottom: 40,
        inner: 5
      };
      halfh = h + margin.top + margin.bottom;
      totalh = halfh * 2;
      halfw = w + margin.left + margin.right;
      totalw = halfw * 2;
      mychart = this.scatterplot().xvar(0).yvar(1).xlab("Fishing Value").ylab("Ecological Value").height(h).width(w).margin(margin);
      ch = d3.select(this.$('.tradeoff-chart'));
      ch.datum(tradeoff_data).call(mychart);
      tooltip = d3.select("body").append("div").attr("class", "chart-tooltip").attr("id", "chart-tooltip").text("data");
      mychart.pointsSelect().on("mouseover", function(d) {
        return tooltip.style("visibility", "visible").html("<ul><strong>Proposal: " + window.app.sketches.get(d.PROPOSAL).attributes.name + "</strong><li> Fishing value: " + d.FISH_VAL + "</li><li> Conservation value: " + d.ECO_VAL + "</li></ul>");
      });
      mychart.pointsSelect().on("mousemove", function(d) {
        return tooltip.style("top", (event.pageY - 10) + "px").style("left", (calc_ttip(event.pageX, d, tooltip)) + "px");
      });
      mychart.pointsSelect().on("mouseout", function(d) {
        return tooltip.style("visibility", "hidden");
      });
      mychart.labelsSelect().on("mouseover", function(d) {
        return tooltip.style("visibility", "visible").html("<ul><strong>Proposal: " + window.app.sketches.get(d.PROPOSAL).attributes.name + "</strong><li> Fishing value: " + d.FISH_VAL + "</li><li> Conservation value: " + d.ECO_VAL + "</li></ul>");
      });
      mychart.labelsSelect().on("mousemove", function(d) {
        return tooltip.style("top", (event.pageY - 10) + "px").style("left", (calc_ttip(event.pageX, d, tooltip)) + "px");
      });
      return mychart.labelsSelect().on("mouseout", function(d) {
        return tooltip.style("visibility", "hidden");
      });
    }
  };

  calc_ttip = function(xloc, data, tooltip) {
    var tdiv, tleft, tw;
    tdiv = tooltip[0][0].getBoundingClientRect();
    tleft = tdiv.left;
    tw = tdiv.width;
    if (xloc + tw > tleft + tw) {
      return xloc - (tw + 10);
    }
    return xloc + 10;
  };

  ArrayTradeoffsTab.prototype.scatterplot = function() {
    var axispos, chart, el, height, labelsSelect, legendSelect, legendheight, margin, nxticks, nyticks, pointsSelect, pointsize, rectcolor, view, width, xlab, xlim, xscale, xticks, ylab, ylim, yscale, yticks;
    view = this;
    width = 380;
    height = 600;
    margin = {
      left: 40,
      top: 5,
      right: 40,
      bottom: 40,
      inner: 5
    };
    axispos = {
      xtitle: 25,
      ytitle: 30,
      xlabel: 5,
      ylabel: 5
    };
    xlim = null;
    ylim = null;
    nxticks = 5;
    xticks = null;
    nyticks = 5;
    yticks = null;
    rectcolor = "#dbe4ee";
    pointsize = 5;
    xlab = "X";
    ylab = "Y score";
    yscale = d3.scale.linear();
    xscale = d3.scale.linear();
    legendheight = 300;
    pointsSelect = null;
    labelsSelect = null;
    legendSelect = null;
    if (window.d3) {
      view.$('.tradeoff-chart').html('');
      el = view.$('.tradeoff-chart')[0];
    }
    chart = function(selection) {
      return selection.each(function(data) {
        var currelem, g, labels, na_value, panelheight, paneloffset, panelwidth, points, svg, x, xaxis, xrange, xs, y, yaxis, yrange, ys;
        x = data.map(function(d) {
          return parseFloat(d.FISH_VAL);
        });
        y = data.map(function(d) {
          return parseFloat(d.ECO_VAL);
        });
        paneloffset = 0;
        panelwidth = width;
        panelheight = height;
        if (!(xlim != null)) {
          xlim = [d3.min(x) - 2, parseFloat(d3.max(x) + 2)];
        }
        if (!(ylim != null)) {
          ylim = [d3.min(y) - 2, parseFloat(d3.max(y) + 2)];
        }
        na_value = d3.min(x.concat(y)) - 100;
        currelem = d3.select(view.$('.tradeoff-chart')[0]);
        svg = d3.select(view.$('.tradeoff-chart')[0]).append("svg").data([data]);
        svg.append("g");
        svg.attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom + data.length * 35);
        g = svg.select("g");
        g.append("rect").attr("x", paneloffset + margin.left).attr("y", margin.top).attr("height", panelheight).attr("width", panelwidth).attr("fill", rectcolor).attr("stroke", "none");
        xrange = [margin.left + paneloffset + margin.inner, margin.left + paneloffset + panelwidth - margin.inner];
        yrange = [margin.top + panelheight - margin.inner, margin.top + margin.inner];
        xscale.domain(xlim).range(xrange);
        yscale.domain(ylim).range(yrange);
        xs = d3.scale.linear().domain(xlim).range(xrange);
        ys = d3.scale.linear().domain(ylim).range(yrange);
        if (!(yticks != null)) {
          yticks = ys.ticks(nyticks);
        }
        if (!(xticks != null)) {
          xticks = xs.ticks(nxticks);
        }
        xaxis = g.append("g").attr("class", "x axis");
        xaxis.selectAll("empty").data(xticks).enter().append("line").attr("x1", function(d) {
          return xscale(d);
        }).attr("x2", function(d) {
          return xscale(d);
        }).attr("y1", margin.top).attr("y2", margin.top + height).attr("fill", "none").attr("stroke", "white").attr("stroke-width", 1).style("pointer-events", "none");
        xaxis.selectAll("empty").data(xticks).enter().append("text").attr("x", function(d) {
          return xscale(d);
        }).attr("y", margin.top + height + axispos.xlabel).text(function(d) {
          return formatAxis(xticks)(d);
        });
        xaxis.append("text").attr("class", "xaxis-title").attr("x", margin.left + width / 2).attr("y", margin.top + height + axispos.xtitle).text(xlab);
        xaxis.selectAll("empty").data(data).enter().append("circle").attr("cx", function(d, i) {
          return margin.left;
        }).attr("cy", function(d, i) {
          return margin.top + height + axispos.xtitle + ((i + 1) * 30) + 6;
        }).attr("class", function(d, i) {
          return "pt" + i;
        }).attr("r", pointsize).attr("fill", function(d, i) {
          var col;
          val = i % 17;
          col = getColors(val);
          return col;
        }).attr("stroke", function(d, i) {
          var col;
          val = Math.floor(i / 17) % 5;
          col = getStrokeColor(val);
          return col;
        }).attr("stroke-width", "1");
        xaxis.selectAll("empty").data(data).enter().append("text").attr("class", "legend-text").attr("x", function(d, i) {
          return margin.left + 20;
        }).attr("y", function(d, i) {
          return margin.top + height + axispos.xtitle + ((i + 1) * 30);
        }).text(function(d) {
          return window.app.sketches.get(d.PROPOSAL).attributes.name;
        });
        yaxis = g.append("g").attr("class", "y axis");
        yaxis.selectAll("empty").data(yticks).enter().append("line").attr("y1", function(d) {
          return yscale(d);
        }).attr("y2", function(d) {
          return yscale(d);
        }).attr("x1", margin.left).attr("x2", margin.left + width).attr("fill", "none").attr("stroke", "white").attr("stroke-width", 1).style("pointer-events", "none");
        yaxis.selectAll("empty").data(yticks).enter().append("text").attr("y", function(d) {
          return yscale(d);
        }).attr("x", margin.left - axispos.ylabel).text(function(d) {
          return formatAxis(yticks)(d);
        });
        yaxis.append("text").attr("class", "title").attr("y", margin.top + height / 2).attr("x", margin.left - axispos.ytitle).text(ylab).attr("transform", "rotate(270," + (margin.left - axispos.ytitle) + "," + (margin.top + height / 2) + ")");
        labels = g.append("g").attr("id", "labels");
        labelsSelect = labels.selectAll("empty").data(data).enter().append("text").text(function(d) {
          return window.app.sketches.get(d.PROPOSAL).attributes.name;
        }).attr("x", function(d, i) {
          var overlap_xstart, string_end, xpos;
          xpos = xscale(x[i]);
          string_end = xpos + this.getComputedTextLength();
          overlap_xstart = xpos - (this.getComputedTextLength() + 5);
          if (overlap_xstart < 50) {
            overlap_xstart = 50;
          }
          if (string_end > width) {
            return overlap_xstart;
          }
          return xpos + 5;
        }).attr("y", function(d, i) {
          var ypos;
          ypos = yscale(y[i]);
          if (ypos < 50) {
            return ypos + 10;
          }
          return ypos - 5;
        });
        points = g.append("g").attr("id", "points");
        pointsSelect = points.selectAll("empty").data(data).enter().append("circle").attr("cx", function(d, i) {
          return xscale(x[i]);
        }).attr("cy", function(d, i) {
          return yscale(y[i]);
        }).attr("class", function(d, i) {
          return "pt" + i;
        }).attr("r", pointsize).attr("fill", function(d, i) {
          var col;
          val = i;
          col = getColors([val]);
          return col;
        }).attr("stroke", function(d, i) {
          var col;
          val = Math.floor(i / 17) % 5;
          col = getStrokeColor(val);
          return col;
        }).attr("stroke-width", "1").attr("opacity", function(d, i) {
          if (((x[i] != null) || xNA.handle) && ((y[i] != null) || yNA.handle)) {
            return 1;
          }
          return 0;
        });
        return g.append("rect").attr("x", margin.left + paneloffset).attr("y", margin.top).attr("height", panelheight).attr("width", panelwidth).attr("fill", "none").attr("stroke", "black").attr("stroke-width", "none");
      });
    };
    chart.width = function(value) {
      if (!arguments.length) {
        return width;
      }
      width = value;
      return chart;
    };
    chart.height = function(value) {
      if (!arguments.length) {
        return height;
      }
      height = value;
      return chart;
    };
    chart.margin = function(value) {
      if (!arguments.length) {
        return margin;
      }
      margin = value;
      return chart;
    };
    chart.axispos = function(value) {
      if (!arguments.length) {
        return axispos;
      }
      axispos = value;
      return chart;
    };
    chart.xlim = function(value) {
      if (!arguments.length) {
        return xlim;
      }
      xlim = value;
      return chart;
    };
    chart.nxticks = function(value) {
      if (!arguments.length) {
        return nxticks;
      }
      nxticks = value;
      return chart;
    };
    chart.xticks = function(value) {
      if (!arguments.length) {
        return xticks;
      }
      xticks = value;
      return chart;
    };
    chart.ylim = function(value) {
      if (!arguments.length) {
        return ylim;
      }
      ylim = value;
      return chart;
    };
    chart.nyticks = function(value) {
      if (!arguments.length) {
        return nyticks;
      }
      nyticks = value;
      return chart;
    };
    chart.yticks = function(value) {
      if (!arguments.length) {
        return yticks;
      }
      yticks = value;
      return chart;
    };
    chart.rectcolor = function(value) {
      if (!arguments.length) {
        return rectcolor;
      }
      rectcolor = value;
      return chart;
    };
    chart.pointcolor = function(value) {
      var pointcolor;
      if (!arguments.length) {
        return pointcolor;
      }
      pointcolor = value;
      return chart;
    };
    chart.pointsize = function(value) {
      if (!arguments.length) {
        return pointsize;
      }
      pointsize = value;
      return chart;
    };
    chart.pointstroke = function(value) {
      var pointstroke;
      if (!arguments.length) {
        return pointstroke;
      }
      pointstroke = value;
      return chart;
    };
    chart.xlab = function(value) {
      if (!arguments.length) {
        return xlab;
      }
      xlab = value;
      return chart;
    };
    chart.ylab = function(value) {
      if (!arguments.length) {
        return ylab;
      }
      ylab = value;
      return chart;
    };
    chart.xvar = function(value) {
      var xvar;
      if (!arguments.length) {
        return xvar;
      }
      xvar = value;
      return chart;
    };
    chart.yvar = function(value) {
      var yvar;
      if (!arguments.length) {
        return yvar;
      }
      yvar = value;
      return chart;
    };
    chart.yscale = function() {
      return yscale;
    };
    chart.xscale = function() {
      return xscale;
    };
    chart.pointsSelect = function() {
      return pointsSelect;
    };
    chart.labelsSelect = function() {
      return labelsSelect;
    };
    chart.legendSelect = function() {
      return legendSelect;
    };
    return chart;
  };

  getColors = function(i) {
    var colors;
    colors = ["LightGreen", "LightPink", "LightSkyBlue", "Moccasin", "BlueViolet", "Gainsboro", "DarkGreen", "DarkTurquoise", "maroon", "navy", "LemonChiffon", "orange", "red", "silver", "teal", "white", "black"];
    return colors[i];
  };

  getStrokeColor = function(i) {
    var scolors;
    scolors = ["black", "white", "gray", "brown", "Navy"];
    return scolors[i];
  };

  formatAxis = function(d) {
    var ndig;
    d = d[1] - d[0];
    ndig = Math.floor(Math.log(d % 10) / Math.log(10));
    if (ndig > 0) {
      ndig = 0;
    }
    ndig = Math.abs(ndig);
    return d3.format("." + ndig + "f");
  };

  return ArrayTradeoffsTab;

})(ReportTab);

module.exports = ArrayTradeoffsTab;


},{"../templates/templates.js":17,"api/templates":"CNqB+b","api/utils":"+VosKh","reportTab":"a21iR2"}],15:[function(require,module,exports){
module.exports = {
  SANCTUARY_ID: '533de96ba498867c56c6d1c5',
  AQUACULTURE_ID: '520bb1c00bd22c9b2147b99b',
  MOORING_ID: '533de4e3a498867c56c6cd45',
  NO_NET_ZONES_ID: '533de620a498867c56c6cfc2',
  SHIPPING_ZONE_ID: '533deca7a498867c56c6d55f'
};


},{}],16:[function(require,module,exports){
var ArrayFishingValueTab, ArrayHabitatTab, ArrayOverviewTab, ArrayTradeoffsTab, templates;

templates = require('../templates/templates.js');

ArrayOverviewTab = require('./arrayOverviewTab.coffee');

ArrayHabitatTab = require('./arrayHabitatTab.coffee');

ArrayFishingValueTab = require('./arrayFishingValueTab.coffee');

ArrayTradeoffsTab = require('./arrayTradeoffs.coffee');

window.app.registerReport(function(report) {
  report.tabs([ArrayOverviewTab, ArrayHabitatTab, ArrayFishingValueTab, ArrayTradeoffsTab]);
  return report.stylesheets(['./proposal.css']);
});


},{"../templates/templates.js":17,"./arrayFishingValueTab.coffee":11,"./arrayHabitatTab.coffee":12,"./arrayOverviewTab.coffee":13,"./arrayTradeoffs.coffee":14}],17:[function(require,module,exports){
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
},{}]},{},[16])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL3RyYWluaW5nLXJlcG9ydHMtdjIvbm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvdHJhaW5pbmctcmVwb3J0cy12Mi9ub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9saWIvX2VtcHR5LmpzIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL2VuYWJsZUxheWVyVG9nZ2xlcnMuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL2pvYkl0ZW0uY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL3JlcG9ydFJlc3VsdHMuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL3JlcG9ydFRhYi5jb2ZmZWUiLCIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL3RyYWluaW5nLXJlcG9ydHMtdjIvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvdXRpbHMuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL3NjcmlwdHMvYXJyYXlGaXNoaW5nVmFsdWVUYWIuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL3NjcmlwdHMvYXJyYXlIYWJpdGF0VGFiLmNvZmZlZSIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvdHJhaW5pbmctcmVwb3J0cy12Mi9zY3JpcHRzL2FycmF5T3ZlcnZpZXdUYWIuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL3NjcmlwdHMvYXJyYXlUcmFkZW9mZnMuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL3NjcmlwdHMvaWRzLmNvZmZlZSIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvdHJhaW5pbmctcmVwb3J0cy12Mi9zY3JpcHRzL3Byb3Bvc2FsLmNvZmZlZSIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvdHJhaW5pbmctcmVwb3J0cy12Mi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7O0FDQUEsQ0FBTyxDQUFVLENBQUEsR0FBWCxDQUFOLEVBQWtCO0NBQ2hCLEtBQUEsMkVBQUE7Q0FBQSxDQUFBLENBQUE7Q0FBQSxDQUNBLENBQUEsR0FBWTtDQURaLENBRUEsQ0FBQSxHQUFNO0FBQ0MsQ0FBUCxDQUFBLENBQUEsQ0FBQTtDQUNFLEVBQUEsQ0FBQSxHQUFPLHFCQUFQO0NBQ0EsU0FBQTtJQUxGO0NB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RUFBQTtNQUZBO0NBQUEsRUFHTyxDQUFQO0NBQ0csQ0FBRCxDQUFTLENBQUEsRUFBWCxLQUFBO0NBdGFGLEVBaWFhOztDQWphYjs7Q0FEOEI7O0FBeWFoQyxDQW5iQSxFQW1iaUIsR0FBWCxDQUFOLFVBbmJBOzs7O0FDQUEsQ0FBTyxFQUNMLEdBREksQ0FBTjtDQUNFLENBQUEsVUFBQSxjQUFBO0NBQUEsQ0FDQSxZQUFBLFlBREE7Q0FBQSxDQUVBLFFBQUEsZ0JBRkE7Q0FBQSxDQUdBLGFBQUEsV0FIQTtDQUFBLENBSUEsY0FBQSxVQUpBO0NBREYsQ0FBQTs7OztBQ0FBLElBQUEsaUZBQUE7O0FBQUEsQ0FBQSxFQUFZLElBQUEsRUFBWixrQkFBWTs7QUFDWixDQURBLEVBQ21CLElBQUEsU0FBbkIsV0FBbUI7O0FBQ25CLENBRkEsRUFFa0IsSUFBQSxRQUFsQixXQUFrQjs7QUFDbEIsQ0FIQSxFQUd1QixJQUFBLGFBQXZCLFdBQXVCOztBQUN2QixDQUpBLEVBSW9CLElBQUEsVUFBcEIsUUFBb0I7O0FBRXBCLENBTkEsRUFNVSxHQUFKLEdBQXFCLEtBQTNCO0NBQ0UsQ0FBQSxFQUFBLEVBQU0sU0FBTSxDQUFBLENBQUEsR0FBQTtDQUdMLEtBQUQsR0FBTixFQUFBLEtBQW1CO0NBSks7Ozs7QUNOMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLG51bGwsIm1vZHVsZS5leHBvcnRzID0gKGVsKSAtPlxuICAkZWwgPSAkIGVsXG4gIGFwcCA9IHdpbmRvdy5hcHBcbiAgdG9jID0gYXBwLmdldFRvYygpXG4gIHVubGVzcyB0b2NcbiAgICBjb25zb2xlLmxvZyAnTm8gdGFibGUgb2YgY29udGVudHMgZm91bmQnXG4gICAgcmV0dXJuXG4gIHRvZ2dsZXJzID0gJGVsLmZpbmQoJ2FbZGF0YS10b2dnbGUtbm9kZV0nKVxuICAjIFNldCBpbml0aWFsIHN0YXRlXG4gIGZvciB0b2dnbGVyIGluIHRvZ2dsZXJzLnRvQXJyYXkoKVxuICAgICR0b2dnbGVyID0gJCh0b2dnbGVyKVxuICAgIG5vZGVpZCA9ICR0b2dnbGVyLmRhdGEoJ3RvZ2dsZS1ub2RlJylcbiAgICB0cnlcbiAgICAgIHZpZXcgPSB0b2MuZ2V0Q2hpbGRWaWV3QnlJZCBub2RlaWRcbiAgICAgIG5vZGUgPSB2aWV3Lm1vZGVsXG4gICAgICAkdG9nZ2xlci5hdHRyICdkYXRhLXZpc2libGUnLCAhIW5vZGUuZ2V0KCd2aXNpYmxlJylcbiAgICAgICR0b2dnbGVyLmRhdGEgJ3RvY0l0ZW0nLCB2aWV3XG4gICAgY2F0Y2ggZVxuICAgICAgJHRvZ2dsZXIuYXR0ciAnZGF0YS1ub3QtZm91bmQnLCAndHJ1ZSdcblxuICB0b2dnbGVycy5vbiAnY2xpY2snLCAoZSkgLT5cbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAkZWwgPSAkKGUudGFyZ2V0KVxuICAgIHZpZXcgPSAkZWwuZGF0YSgndG9jSXRlbScpXG4gICAgaWYgdmlld1xuICAgICAgdmlldy50b2dnbGVWaXNpYmlsaXR5KGUpXG4gICAgICAkZWwuYXR0ciAnZGF0YS12aXNpYmxlJywgISF2aWV3Lm1vZGVsLmdldCgndmlzaWJsZScpXG4gICAgZWxzZVxuICAgICAgYWxlcnQgXCJMYXllciBub3QgZm91bmQgaW4gdGhlIGN1cnJlbnQgVGFibGUgb2YgQ29udGVudHMuIFxcbkV4cGVjdGVkIG5vZGVpZCAjeyRlbC5kYXRhKCd0b2dnbGUtbm9kZScpfVwiXG4iLCJjbGFzcyBKb2JJdGVtIGV4dGVuZHMgQmFja2JvbmUuVmlld1xuICBjbGFzc05hbWU6ICdyZXBvcnRSZXN1bHQnXG4gIGV2ZW50czoge31cbiAgYmluZGluZ3M6XG4gICAgXCJoNiBhXCI6XG4gICAgICBvYnNlcnZlOiBcInNlcnZpY2VOYW1lXCJcbiAgICAgIHVwZGF0ZVZpZXc6IHRydWVcbiAgICAgIGF0dHJpYnV0ZXM6IFt7XG4gICAgICAgIG5hbWU6ICdocmVmJ1xuICAgICAgICBvYnNlcnZlOiAnc2VydmljZVVybCdcbiAgICAgIH1dXG4gICAgXCIuc3RhcnRlZEF0XCI6XG4gICAgICBvYnNlcnZlOiBbXCJzdGFydGVkQXRcIiwgXCJzdGF0dXNcIl1cbiAgICAgIHZpc2libGU6ICgpIC0+XG4gICAgICAgIEBtb2RlbC5nZXQoJ3N0YXR1cycpIG5vdCBpbiBbJ2NvbXBsZXRlJywgJ2Vycm9yJ11cbiAgICAgIHVwZGF0ZVZpZXc6IHRydWVcbiAgICAgIG9uR2V0OiAoKSAtPlxuICAgICAgICBpZiBAbW9kZWwuZ2V0KCdzdGFydGVkQXQnKVxuICAgICAgICAgIHJldHVybiBcIlN0YXJ0ZWQgXCIgKyBtb21lbnQoQG1vZGVsLmdldCgnc3RhcnRlZEF0JykpLmZyb21Ob3coKSArIFwiLiBcIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgXCJcIlxuICAgIFwiLnN0YXR1c1wiOiAgICAgIFxuICAgICAgb2JzZXJ2ZTogXCJzdGF0dXNcIlxuICAgICAgb25HZXQ6IChzKSAtPlxuICAgICAgICBzd2l0Y2ggc1xuICAgICAgICAgIHdoZW4gJ3BlbmRpbmcnXG4gICAgICAgICAgICBcIndhaXRpbmcgaW4gbGluZVwiXG4gICAgICAgICAgd2hlbiAncnVubmluZydcbiAgICAgICAgICAgIFwicnVubmluZyBhbmFseXRpY2FsIHNlcnZpY2VcIlxuICAgICAgICAgIHdoZW4gJ2NvbXBsZXRlJ1xuICAgICAgICAgICAgXCJjb21wbGV0ZWRcIlxuICAgICAgICAgIHdoZW4gJ2Vycm9yJ1xuICAgICAgICAgICAgXCJhbiBlcnJvciBvY2N1cnJlZFwiXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgc1xuICAgIFwiLnF1ZXVlTGVuZ3RoXCI6IFxuICAgICAgb2JzZXJ2ZTogXCJxdWV1ZUxlbmd0aFwiXG4gICAgICBvbkdldDogKHYpIC0+XG4gICAgICAgIHMgPSBcIldhaXRpbmcgYmVoaW5kICN7dn0gam9iXCJcbiAgICAgICAgaWYgdi5sZW5ndGggPiAxXG4gICAgICAgICAgcyArPSAncydcbiAgICAgICAgcmV0dXJuIHMgKyBcIi4gXCJcbiAgICAgIHZpc2libGU6ICh2KSAtPlxuICAgICAgICB2PyBhbmQgcGFyc2VJbnQodikgPiAwXG4gICAgXCIuZXJyb3JzXCI6XG4gICAgICBvYnNlcnZlOiAnZXJyb3InXG4gICAgICB1cGRhdGVWaWV3OiB0cnVlXG4gICAgICB2aXNpYmxlOiAodikgLT5cbiAgICAgICAgdj8ubGVuZ3RoID4gMlxuICAgICAgb25HZXQ6ICh2KSAtPlxuICAgICAgICBpZiB2P1xuICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHYsIG51bGwsICcgICcpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBudWxsXG5cbiAgY29uc3RydWN0b3I6IChAbW9kZWwpIC0+XG4gICAgc3VwZXIoKVxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICBAJGVsLmh0bWwgXCJcIlwiXG4gICAgICA8aDY+PGEgaHJlZj1cIiNcIiB0YXJnZXQ9XCJfYmxhbmtcIj48L2E+PHNwYW4gY2xhc3M9XCJzdGF0dXNcIj48L3NwYW4+PC9oNj5cbiAgICAgIDxkaXY+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwic3RhcnRlZEF0XCI+PC9zcGFuPlxuICAgICAgICA8c3BhbiBjbGFzcz1cInF1ZXVlTGVuZ3RoXCI+PC9zcGFuPlxuICAgICAgICA8cHJlIGNsYXNzPVwiZXJyb3JzXCI+PC9wcmU+XG4gICAgICA8L2Rpdj5cbiAgICBcIlwiXCJcbiAgICBAc3RpY2tpdCgpXG5cbm1vZHVsZS5leHBvcnRzID0gSm9iSXRlbSIsImNsYXNzIFJlcG9ydFJlc3VsdHMgZXh0ZW5kcyBCYWNrYm9uZS5Db2xsZWN0aW9uXG5cbiAgZGVmYXVsdFBvbGxpbmdJbnRlcnZhbDogMzAwMFxuXG4gIGNvbnN0cnVjdG9yOiAoQHNrZXRjaCwgQGRlcHMpIC0+XG4gICAgQHVybCA9IHVybCA9IFwiL3JlcG9ydHMvI3tAc2tldGNoLmlkfS8je0BkZXBzLmpvaW4oJywnKX1cIlxuICAgIHN1cGVyKClcblxuICBwb2xsOiAoKSA9PlxuICAgIEBmZXRjaCB7XG4gICAgICBzdWNjZXNzOiAoKSA9PlxuICAgICAgICBAdHJpZ2dlciAnam9icydcbiAgICAgICAgZm9yIHJlc3VsdCBpbiBAbW9kZWxzXG4gICAgICAgICAgaWYgcmVzdWx0LmdldCgnc3RhdHVzJykgbm90IGluIFsnY29tcGxldGUnLCAnZXJyb3InXVxuICAgICAgICAgICAgdW5sZXNzIEBpbnRlcnZhbFxuICAgICAgICAgICAgICBAaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCBAcG9sbCwgQGRlZmF1bHRQb2xsaW5nSW50ZXJ2YWxcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIGNvbnNvbGUubG9nIEBtb2RlbHNbMF0uZ2V0KCdwYXlsb2FkU2l6ZUJ5dGVzJylcbiAgICAgICAgICBwYXlsb2FkU2l6ZSA9IE1hdGgucm91bmQoKChAbW9kZWxzWzBdLmdldCgncGF5bG9hZFNpemVCeXRlcycpIG9yIDApIC8gMTAyNCkgKiAxMDApIC8gMTAwXG4gICAgICAgICAgY29uc29sZS5sb2cgXCJGZWF0dXJlU2V0IHNlbnQgdG8gR1Agd2VpZ2hlZCBpbiBhdCAje3BheWxvYWRTaXplfWtiXCJcbiAgICAgICAgIyBhbGwgY29tcGxldGUgdGhlblxuICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChAaW50ZXJ2YWwpIGlmIEBpbnRlcnZhbFxuICAgICAgICBpZiBwcm9ibGVtID0gXy5maW5kKEBtb2RlbHMsIChyKSAtPiByLmdldCgnZXJyb3InKT8pXG4gICAgICAgICAgQHRyaWdnZXIgJ2Vycm9yJywgXCJQcm9ibGVtIHdpdGggI3twcm9ibGVtLmdldCgnc2VydmljZU5hbWUnKX0gam9iXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEB0cmlnZ2VyICdmaW5pc2hlZCdcbiAgICAgIGVycm9yOiAoZSwgcmVzLCBhLCBiKSA9PlxuICAgICAgICB1bmxlc3MgcmVzLnN0YXR1cyBpcyAwXG4gICAgICAgICAgaWYgcmVzLnJlc3BvbnNlVGV4dD8ubGVuZ3RoXG4gICAgICAgICAgICB0cnlcbiAgICAgICAgICAgICAganNvbiA9IEpTT04ucGFyc2UocmVzLnJlc3BvbnNlVGV4dClcbiAgICAgICAgICAgIGNhdGNoXG4gICAgICAgICAgICAgICMgZG8gbm90aGluZ1xuICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKEBpbnRlcnZhbCkgaWYgQGludGVydmFsXG4gICAgICAgICAgQHRyaWdnZXIgJ2Vycm9yJywganNvbj8uZXJyb3I/Lm1lc3NhZ2Ugb3JcbiAgICAgICAgICAgICdQcm9ibGVtIGNvbnRhY3RpbmcgdGhlIFNlYVNrZXRjaCBzZXJ2ZXInXG4gICAgfVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlcG9ydFJlc3VsdHNcbiIsImVuYWJsZUxheWVyVG9nZ2xlcnMgPSByZXF1aXJlICcuL2VuYWJsZUxheWVyVG9nZ2xlcnMuY29mZmVlJ1xucm91bmQgPSByZXF1aXJlKCcuL3V0aWxzLmNvZmZlZScpLnJvdW5kXG5SZXBvcnRSZXN1bHRzID0gcmVxdWlyZSAnLi9yZXBvcnRSZXN1bHRzLmNvZmZlZSdcbnQgPSByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJylcbnRlbXBsYXRlcyA9XG4gIHJlcG9ydExvYWRpbmc6IHRbJ25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9yZXBvcnRMb2FkaW5nJ11cbkpvYkl0ZW0gPSByZXF1aXJlICcuL2pvYkl0ZW0uY29mZmVlJ1xuQ29sbGVjdGlvblZpZXcgPSByZXF1aXJlKCd2aWV3cy9jb2xsZWN0aW9uVmlldycpXG5cbmNsYXNzIFJlY29yZFNldFxuXG4gIGNvbnN0cnVjdG9yOiAoQGRhdGEsIEB0YWIsIEBza2V0Y2hDbGFzc0lkKSAtPlxuXG4gIHRvQXJyYXk6ICgpIC0+XG4gICAgaWYgQHNrZXRjaENsYXNzSWRcbiAgICAgIGRhdGEgPSBfLmZpbmQgQGRhdGEudmFsdWUsICh2KSA9PlxuICAgICAgICB2LmZlYXR1cmVzP1swXT8uYXR0cmlidXRlcz9bJ1NDX0lEJ10gaXMgQHNrZXRjaENsYXNzSWRcbiAgICAgIHVubGVzcyBkYXRhXG4gICAgICAgIHRocm93IFwiQ291bGQgbm90IGZpbmQgZGF0YSBmb3Igc2tldGNoQ2xhc3MgI3tAc2tldGNoQ2xhc3NJZH1cIlxuICAgIGVsc2VcbiAgICAgIGlmIF8uaXNBcnJheSBAZGF0YS52YWx1ZVxuICAgICAgICBkYXRhID0gQGRhdGEudmFsdWVbMF1cbiAgICAgIGVsc2VcbiAgICAgICAgZGF0YSA9IEBkYXRhLnZhbHVlXG4gICAgXy5tYXAgZGF0YS5mZWF0dXJlcywgKGZlYXR1cmUpIC0+XG4gICAgICBmZWF0dXJlLmF0dHJpYnV0ZXNcblxuICByYXc6IChhdHRyKSAtPlxuICAgIGF0dHJzID0gXy5tYXAgQHRvQXJyYXkoKSwgKHJvdykgLT5cbiAgICAgIHJvd1thdHRyXVxuICAgIGF0dHJzID0gXy5maWx0ZXIgYXR0cnMsIChhdHRyKSAtPiBhdHRyICE9IHVuZGVmaW5lZFxuICAgIGlmIGF0dHJzLmxlbmd0aCBpcyAwXG4gICAgICBjb25zb2xlLmxvZyBAZGF0YVxuICAgICAgQHRhYi5yZXBvcnRFcnJvciBcIkNvdWxkIG5vdCBnZXQgYXR0cmlidXRlICN7YXR0cn0gZnJvbSByZXN1bHRzXCJcbiAgICAgIHRocm93IFwiQ291bGQgbm90IGdldCBhdHRyaWJ1dGUgI3thdHRyfVwiXG4gICAgZWxzZSBpZiBhdHRycy5sZW5ndGggaXMgMVxuICAgICAgcmV0dXJuIGF0dHJzWzBdXG4gICAgZWxzZVxuICAgICAgcmV0dXJuIGF0dHJzXG5cbiAgaW50OiAoYXR0cikgLT5cbiAgICByYXcgPSBAcmF3KGF0dHIpXG4gICAgaWYgXy5pc0FycmF5KHJhdylcbiAgICAgIF8ubWFwIHJhdywgcGFyc2VJbnRcbiAgICBlbHNlXG4gICAgICBwYXJzZUludChyYXcpXG5cbiAgZmxvYXQ6IChhdHRyLCBkZWNpbWFsUGxhY2VzPTIpIC0+XG4gICAgcmF3ID0gQHJhdyhhdHRyKVxuICAgIGlmIF8uaXNBcnJheShyYXcpXG4gICAgICBfLm1hcCByYXcsICh2YWwpIC0+IHJvdW5kKHZhbCwgZGVjaW1hbFBsYWNlcylcbiAgICBlbHNlXG4gICAgICByb3VuZChyYXcsIGRlY2ltYWxQbGFjZXMpXG5cbiAgYm9vbDogKGF0dHIpIC0+XG4gICAgcmF3ID0gQHJhdyhhdHRyKVxuICAgIGlmIF8uaXNBcnJheShyYXcpXG4gICAgICBfLm1hcCByYXcsICh2YWwpIC0+IHZhbC50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkgaXMgJ3RydWUnXG4gICAgZWxzZVxuICAgICAgcmF3LnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKSBpcyAndHJ1ZSdcblxuY2xhc3MgUmVwb3J0VGFiIGV4dGVuZHMgQmFja2JvbmUuVmlld1xuICBuYW1lOiAnSW5mb3JtYXRpb24nXG4gIGRlcGVuZGVuY2llczogW11cblxuICBpbml0aWFsaXplOiAoQG1vZGVsLCBAb3B0aW9ucykgLT5cbiAgICAjIFdpbGwgYmUgaW5pdGlhbGl6ZWQgYnkgU2VhU2tldGNoIHdpdGggdGhlIGZvbGxvd2luZyBhcmd1bWVudHM6XG4gICAgIyAgICogbW9kZWwgLSBUaGUgc2tldGNoIGJlaW5nIHJlcG9ydGVkIG9uXG4gICAgIyAgICogb3B0aW9uc1xuICAgICMgICAgIC0gLnBhcmVudCAtIHRoZSBwYXJlbnQgcmVwb3J0IHZpZXdcbiAgICAjICAgICAgICBjYWxsIEBvcHRpb25zLnBhcmVudC5kZXN0cm95KCkgdG8gY2xvc2UgdGhlIHdob2xlIHJlcG9ydCB3aW5kb3dcbiAgICBAYXBwID0gd2luZG93LmFwcFxuICAgIF8uZXh0ZW5kIEAsIEBvcHRpb25zXG4gICAgQHJlcG9ydFJlc3VsdHMgPSBuZXcgUmVwb3J0UmVzdWx0cyhAbW9kZWwsIEBkZXBlbmRlbmNpZXMpXG4gICAgQGxpc3RlblRvT25jZSBAcmVwb3J0UmVzdWx0cywgJ2Vycm9yJywgQHJlcG9ydEVycm9yXG4gICAgQGxpc3RlblRvT25jZSBAcmVwb3J0UmVzdWx0cywgJ2pvYnMnLCBAcmVuZGVySm9iRGV0YWlsc1xuICAgIEBsaXN0ZW5Ub09uY2UgQHJlcG9ydFJlc3VsdHMsICdqb2JzJywgQHJlcG9ydEpvYnNcbiAgICBAbGlzdGVuVG8gQHJlcG9ydFJlc3VsdHMsICdmaW5pc2hlZCcsIF8uYmluZCBAcmVuZGVyLCBAXG4gICAgQGxpc3RlblRvT25jZSBAcmVwb3J0UmVzdWx0cywgJ3JlcXVlc3QnLCBAcmVwb3J0UmVxdWVzdGVkXG5cbiAgcmVuZGVyOiAoKSAtPlxuICAgIHRocm93ICdyZW5kZXIgbWV0aG9kIG11c3QgYmUgb3ZlcmlkZGVuJ1xuXG4gIHNob3c6ICgpIC0+XG4gICAgQCRlbC5zaG93KClcbiAgICBAdmlzaWJsZSA9IHRydWVcbiAgICBpZiBAZGVwZW5kZW5jaWVzPy5sZW5ndGggYW5kICFAcmVwb3J0UmVzdWx0cy5tb2RlbHMubGVuZ3RoXG4gICAgICBAcmVwb3J0UmVzdWx0cy5wb2xsKClcbiAgICBlbHNlIGlmICFAZGVwZW5kZW5jaWVzPy5sZW5ndGhcbiAgICAgIEByZW5kZXIoKVxuICAgICAgQCQoJ1tkYXRhLWF0dHJpYnV0ZS10eXBlPVVybEZpZWxkXSAudmFsdWUsIFtkYXRhLWF0dHJpYnV0ZS10eXBlPVVwbG9hZEZpZWxkXSAudmFsdWUnKS5lYWNoICgpIC0+XG4gICAgICAgIHRleHQgPSAkKEApLnRleHQoKVxuICAgICAgICBodG1sID0gW11cbiAgICAgICAgZm9yIHVybCBpbiB0ZXh0LnNwbGl0KCcsJylcbiAgICAgICAgICBpZiB1cmwubGVuZ3RoXG4gICAgICAgICAgICBuYW1lID0gXy5sYXN0KHVybC5zcGxpdCgnLycpKVxuICAgICAgICAgICAgaHRtbC5wdXNoIFwiXCJcIjxhIHRhcmdldD1cIl9ibGFua1wiIGhyZWY9XCIje3VybH1cIj4je25hbWV9PC9hPlwiXCJcIlxuICAgICAgICAkKEApLmh0bWwgaHRtbC5qb2luKCcsICcpXG5cblxuICBoaWRlOiAoKSAtPlxuICAgIEAkZWwuaGlkZSgpXG4gICAgQHZpc2libGUgPSBmYWxzZVxuXG4gIHJlbW92ZTogKCkgPT5cbiAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbCBAZXRhSW50ZXJ2YWxcbiAgICBAc3RvcExpc3RlbmluZygpXG4gICAgc3VwZXIoKVxuXG4gIHJlcG9ydFJlcXVlc3RlZDogKCkgPT5cbiAgICBAJGVsLmh0bWwgdGVtcGxhdGVzLnJlcG9ydExvYWRpbmcucmVuZGVyKHt9KVxuXG4gIHJlcG9ydEVycm9yOiAobXNnLCBjYW5jZWxsZWRSZXF1ZXN0KSA9PlxuICAgIHVubGVzcyBjYW5jZWxsZWRSZXF1ZXN0XG4gICAgICBpZiBtc2cgaXMgJ0pPQl9FUlJPUidcbiAgICAgICAgQHNob3dFcnJvciAnRXJyb3Igd2l0aCBzcGVjaWZpYyBqb2InXG4gICAgICBlbHNlXG4gICAgICAgIEBzaG93RXJyb3IgbXNnXG5cbiAgc2hvd0Vycm9yOiAobXNnKSA9PlxuICAgIEAkKCcucHJvZ3Jlc3MnKS5yZW1vdmUoKVxuICAgIEAkKCdwLmVycm9yJykucmVtb3ZlKClcbiAgICBAJCgnaDQnKS50ZXh0KFwiQW4gRXJyb3IgT2NjdXJyZWRcIikuYWZ0ZXIgXCJcIlwiXG4gICAgICA8cCBjbGFzcz1cImVycm9yXCIgc3R5bGU9XCJ0ZXh0LWFsaWduOmNlbnRlcjtcIj4je21zZ308L3A+XG4gICAgXCJcIlwiXG5cbiAgcmVwb3J0Sm9iczogKCkgPT5cbiAgICB1bmxlc3MgQG1heEV0YVxuICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykud2lkdGgoJzEwMCUnKVxuICAgIEAkKCdoNCcpLnRleHQgXCJBbmFseXppbmcgRGVzaWduc1wiXG5cbiAgc3RhcnRFdGFDb3VudGRvd246ICgpID0+XG4gICAgaWYgQG1heEV0YVxuICAgICAgXy5kZWxheSAoKSA9PlxuICAgICAgICBAcmVwb3J0UmVzdWx0cy5wb2xsKClcbiAgICAgICwgKEBtYXhFdGEgKyAxKSAqIDEwMDBcbiAgICAgIF8uZGVsYXkgKCkgPT5cbiAgICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykuY3NzICd0cmFuc2l0aW9uLXRpbWluZy1mdW5jdGlvbicsICdsaW5lYXInXG4gICAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLmNzcyAndHJhbnNpdGlvbi1kdXJhdGlvbicsIFwiI3tAbWF4RXRhICsgMX1zXCJcbiAgICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykud2lkdGgoJzEwMCUnKVxuICAgICAgLCA1MDBcblxuICByZW5kZXJKb2JEZXRhaWxzOiAoKSA9PlxuICAgIG1heEV0YSA9IG51bGxcbiAgICBmb3Igam9iIGluIEByZXBvcnRSZXN1bHRzLm1vZGVsc1xuICAgICAgaWYgam9iLmdldCgnZXRhU2Vjb25kcycpXG4gICAgICAgIGlmICFtYXhFdGEgb3Igam9iLmdldCgnZXRhU2Vjb25kcycpID4gbWF4RXRhXG4gICAgICAgICAgbWF4RXRhID0gam9iLmdldCgnZXRhU2Vjb25kcycpXG4gICAgaWYgbWF4RXRhXG4gICAgICBAbWF4RXRhID0gbWF4RXRhXG4gICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS53aWR0aCgnNSUnKVxuICAgICAgQHN0YXJ0RXRhQ291bnRkb3duKClcblxuICAgIEAkKCdbcmVsPWRldGFpbHNdJykuY3NzKCdkaXNwbGF5JywgJ2Jsb2NrJylcbiAgICBAJCgnW3JlbD1kZXRhaWxzXScpLmNsaWNrIChlKSA9PlxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBAJCgnW3JlbD1kZXRhaWxzXScpLmhpZGUoKVxuICAgICAgQCQoJy5kZXRhaWxzJykuc2hvdygpXG4gICAgZm9yIGpvYiBpbiBAcmVwb3J0UmVzdWx0cy5tb2RlbHNcbiAgICAgIGl0ZW0gPSBuZXcgSm9iSXRlbShqb2IpXG4gICAgICBpdGVtLnJlbmRlcigpXG4gICAgICBAJCgnLmRldGFpbHMnKS5hcHBlbmQgaXRlbS5lbFxuXG4gIGdldFJlc3VsdDogKGlkKSAtPlxuICAgIHJlc3VsdHMgPSBAZ2V0UmVzdWx0cygpXG4gICAgcmVzdWx0ID0gXy5maW5kIHJlc3VsdHMsIChyKSAtPiByLnBhcmFtTmFtZSBpcyBpZFxuICAgIHVubGVzcyByZXN1bHQ/XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHJlc3VsdCB3aXRoIGlkICcgKyBpZClcbiAgICByZXN1bHQudmFsdWVcblxuICBnZXRGaXJzdFJlc3VsdDogKHBhcmFtLCBpZCkgLT5cbiAgICByZXN1bHQgPSBAZ2V0UmVzdWx0KHBhcmFtKVxuICAgIHRyeVxuICAgICAgcmV0dXJuIHJlc3VsdFswXS5mZWF0dXJlc1swXS5hdHRyaWJ1dGVzW2lkXVxuICAgIGNhdGNoIGVcbiAgICAgIHRocm93IFwiRXJyb3IgZmluZGluZyAje3BhcmFtfToje2lkfSBpbiBncCByZXN1bHRzXCJcblxuICBnZXRSZXN1bHRzOiAoKSAtPlxuICAgIHJlc3VsdHMgPSBAcmVwb3J0UmVzdWx0cy5tYXAoKHJlc3VsdCkgLT4gcmVzdWx0LmdldCgncmVzdWx0JykucmVzdWx0cylcbiAgICB1bmxlc3MgcmVzdWx0cz8ubGVuZ3RoXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGdwIHJlc3VsdHMnKVxuICAgIF8uZmlsdGVyIHJlc3VsdHMsIChyZXN1bHQpIC0+XG4gICAgICByZXN1bHQucGFyYW1OYW1lIG5vdCBpbiBbJ1Jlc3VsdENvZGUnLCAnUmVzdWx0TXNnJ11cblxuICByZWNvcmRTZXQ6IChkZXBlbmRlbmN5LCBwYXJhbU5hbWUsIHNrZXRjaENsYXNzSWQ9ZmFsc2UpIC0+XG4gICAgdW5sZXNzIGRlcGVuZGVuY3kgaW4gQGRlcGVuZGVuY2llc1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwiVW5rbm93biBkZXBlbmRlbmN5ICN7ZGVwZW5kZW5jeX1cIlxuICAgIGRlcCA9IEByZXBvcnRSZXN1bHRzLmZpbmQgKHIpIC0+IHIuZ2V0KCdzZXJ2aWNlTmFtZScpIGlzIGRlcGVuZGVuY3lcbiAgICB1bmxlc3MgZGVwXG4gICAgICBjb25zb2xlLmxvZyBAcmVwb3J0UmVzdWx0cy5tb2RlbHNcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIkNvdWxkIG5vdCBmaW5kIHJlc3VsdHMgZm9yICN7ZGVwZW5kZW5jeX0uXCJcbiAgICBwYXJhbSA9IF8uZmluZCBkZXAuZ2V0KCdyZXN1bHQnKS5yZXN1bHRzLCAocGFyYW0pIC0+XG4gICAgICBwYXJhbS5wYXJhbU5hbWUgaXMgcGFyYW1OYW1lXG4gICAgdW5sZXNzIHBhcmFtXG4gICAgICBjb25zb2xlLmxvZyBkZXAuZ2V0KCdkYXRhJykucmVzdWx0c1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwiQ291bGQgbm90IGZpbmQgcGFyYW0gI3twYXJhbU5hbWV9IGluICN7ZGVwZW5kZW5jeX1cIlxuICAgIG5ldyBSZWNvcmRTZXQocGFyYW0sIEAsIHNrZXRjaENsYXNzSWQpXG5cbiAgZW5hYmxlVGFibGVQYWdpbmc6ICgpIC0+XG4gICAgQCQoJ1tkYXRhLXBhZ2luZ10nKS5lYWNoICgpIC0+XG4gICAgICAkdGFibGUgPSAkKEApXG4gICAgICBwYWdlU2l6ZSA9ICR0YWJsZS5kYXRhKCdwYWdpbmcnKVxuICAgICAgcm93cyA9ICR0YWJsZS5maW5kKCd0Ym9keSB0cicpLmxlbmd0aFxuICAgICAgcGFnZXMgPSBNYXRoLmNlaWwocm93cyAvIHBhZ2VTaXplKVxuICAgICAgaWYgcGFnZXMgPiAxXG4gICAgICAgICR0YWJsZS5hcHBlbmQgXCJcIlwiXG4gICAgICAgICAgPHRmb290PlxuICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICA8dGQgY29sc3Bhbj1cIiN7JHRhYmxlLmZpbmQoJ3RoZWFkIHRoJykubGVuZ3RofVwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwYWdpbmF0aW9uXCI+XG4gICAgICAgICAgICAgICAgICA8dWw+XG4gICAgICAgICAgICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiPlByZXY8L2E+PC9saT5cbiAgICAgICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICA8L3RyPlxuICAgICAgICAgIDwvdGZvb3Q+XG4gICAgICAgIFwiXCJcIlxuICAgICAgICB1bCA9ICR0YWJsZS5maW5kKCd0Zm9vdCB1bCcpXG4gICAgICAgIGZvciBpIGluIF8ucmFuZ2UoMSwgcGFnZXMgKyAxKVxuICAgICAgICAgIHVsLmFwcGVuZCBcIlwiXCJcbiAgICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiPiN7aX08L2E+PC9saT5cbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgdWwuYXBwZW5kIFwiXCJcIlxuICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiPk5leHQ8L2E+PC9saT5cbiAgICAgICAgXCJcIlwiXG4gICAgICAgICR0YWJsZS5maW5kKCdsaSBhJykuY2xpY2sgKGUpIC0+XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgICAgJGEgPSAkKHRoaXMpXG4gICAgICAgICAgdGV4dCA9ICRhLnRleHQoKVxuICAgICAgICAgIGlmIHRleHQgaXMgJ05leHQnXG4gICAgICAgICAgICBhID0gJGEucGFyZW50KCkucGFyZW50KCkuZmluZCgnLmFjdGl2ZScpLm5leHQoKS5maW5kKCdhJylcbiAgICAgICAgICAgIHVubGVzcyBhLnRleHQoKSBpcyAnTmV4dCdcbiAgICAgICAgICAgICAgYS5jbGljaygpXG4gICAgICAgICAgZWxzZSBpZiB0ZXh0IGlzICdQcmV2J1xuICAgICAgICAgICAgYSA9ICRhLnBhcmVudCgpLnBhcmVudCgpLmZpbmQoJy5hY3RpdmUnKS5wcmV2KCkuZmluZCgnYScpXG4gICAgICAgICAgICB1bmxlc3MgYS50ZXh0KCkgaXMgJ1ByZXYnXG4gICAgICAgICAgICAgIGEuY2xpY2soKVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICRhLnBhcmVudCgpLnBhcmVudCgpLmZpbmQoJy5hY3RpdmUnKS5yZW1vdmVDbGFzcyAnYWN0aXZlJ1xuICAgICAgICAgICAgJGEucGFyZW50KCkuYWRkQ2xhc3MgJ2FjdGl2ZSdcbiAgICAgICAgICAgIG4gPSBwYXJzZUludCh0ZXh0KVxuICAgICAgICAgICAgJHRhYmxlLmZpbmQoJ3Rib2R5IHRyJykuaGlkZSgpXG4gICAgICAgICAgICBvZmZzZXQgPSBwYWdlU2l6ZSAqIChuIC0gMSlcbiAgICAgICAgICAgICR0YWJsZS5maW5kKFwidGJvZHkgdHJcIikuc2xpY2Uob2Zmc2V0LCBuKnBhZ2VTaXplKS5zaG93KClcbiAgICAgICAgJCgkdGFibGUuZmluZCgnbGkgYScpWzFdKS5jbGljaygpXG5cbiAgICAgIGlmIG5vUm93c01lc3NhZ2UgPSAkdGFibGUuZGF0YSgnbm8tcm93cycpXG4gICAgICAgIGlmIHJvd3MgaXMgMFxuICAgICAgICAgIHBhcmVudCA9ICR0YWJsZS5wYXJlbnQoKVxuICAgICAgICAgICR0YWJsZS5yZW1vdmUoKVxuICAgICAgICAgIHBhcmVudC5yZW1vdmVDbGFzcyAndGFibGVDb250YWluZXInXG4gICAgICAgICAgcGFyZW50LmFwcGVuZCBcIjxwPiN7bm9Sb3dzTWVzc2FnZX08L3A+XCJcblxuICBlbmFibGVMYXllclRvZ2dsZXJzOiAoKSAtPlxuICAgIGVuYWJsZUxheWVyVG9nZ2xlcnMoQCRlbClcblxuICBnZXRDaGlsZHJlbjogKHNrZXRjaENsYXNzSWQpIC0+XG4gICAgXy5maWx0ZXIgQGNoaWxkcmVuLCAoY2hpbGQpIC0+IGNoaWxkLmdldFNrZXRjaENsYXNzKCkuaWQgaXMgc2tldGNoQ2xhc3NJZFxuXG5cbm1vZHVsZS5leHBvcnRzID0gUmVwb3J0VGFiXG4iLCJtb2R1bGUuZXhwb3J0cyA9XG4gIFxuICByb3VuZDogKG51bWJlciwgZGVjaW1hbFBsYWNlcykgLT5cbiAgICB1bmxlc3MgXy5pc051bWJlciBudW1iZXJcbiAgICAgIG51bWJlciA9IHBhcnNlRmxvYXQobnVtYmVyKVxuICAgIG11bHRpcGxpZXIgPSBNYXRoLnBvdyAxMCwgZGVjaW1hbFBsYWNlc1xuICAgIE1hdGgucm91bmQobnVtYmVyICogbXVsdGlwbGllcikgLyBtdWx0aXBsaWVyIiwidGhpc1tcIlRlbXBsYXRlc1wiXSA9IHRoaXNbXCJUZW1wbGF0ZXNcIl0gfHwge307XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvYXR0cmlidXRlcy9hdHRyaWJ1dGVJdGVtXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjx0ciBkYXRhLWF0dHJpYnV0ZS1pZD1cXFwiXCIpO18uYihfLnYoXy5mKFwiaWRcIixjLHAsMCkpKTtfLmIoXCJcXFwiIGRhdGEtYXR0cmlidXRlLWV4cG9ydGlkPVxcXCJcIik7Xy5iKF8udihfLmYoXCJleHBvcnRpZFwiLGMscCwwKSkpO18uYihcIlxcXCIgZGF0YS1hdHRyaWJ1dGUtdHlwZT1cXFwiXCIpO18uYihfLnYoXy5mKFwidHlwZVwiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGQgY2xhc3M9XFxcIm5hbWVcXFwiPlwiKTtfLmIoXy52KF8uZihcIm5hbWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRkIGNsYXNzPVxcXCJ2YWx1ZVxcXCI+XCIpO18uYihfLnYoXy5mKFwiZm9ybWF0dGVkVmFsdWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvdHI+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9hdHRyaWJ1dGVzL2F0dHJpYnV0ZXNUYWJsZVwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8dGFibGUgY2xhc3M9XFxcImF0dHJpYnV0ZXNcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJhdHRyaWJ1dGVzXCIsYyxwLDEpLGMscCwwLDQ0LDgxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXy5ycChcImF0dHJpYnV0ZXMvYXR0cmlidXRlSXRlbVwiLGMscCxcIiAgICBcIikpO30pO2MucG9wKCk7fV8uYihcIjwvdGFibGU+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9nZW5lcmljQXR0cmlidXRlc1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtpZihfLnMoXy5kKFwic2tldGNoQ2xhc3MuZGVsZXRlZFwiLGMscCwxKSxjLHAsMCwyNCwyNzAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcImFsZXJ0IGFsZXJ0LXdhcm5cXFwiIHN0eWxlPVxcXCJtYXJnaW4tYm90dG9tOjEwcHg7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFRoaXMgc2tldGNoIHdhcyBjcmVhdGVkIHVzaW5nIHRoZSBcXFwiXCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIlxcXCIgdGVtcGxhdGUsIHdoaWNoIGlzXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBubyBsb25nZXIgYXZhaWxhYmxlLiBZb3Ugd2lsbCBub3QgYmUgYWJsZSB0byBjb3B5IHRoaXMgc2tldGNoIG9yIG1ha2UgbmV3XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBza2V0Y2hlcyBvZiB0aGlzIHR5cGUuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5cIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiIEF0dHJpYnV0ZXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihfLnJwKFwiYXR0cmlidXRlcy9hdHRyaWJ1dGVzVGFibGVcIixjLHAsXCIgICAgXCIpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9yZXBvcnRMb2FkaW5nXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydExvYWRpbmdcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPCEtLSA8ZGl2IGNsYXNzPVxcXCJzcGlubmVyXFxcIj4zPC9kaXY+IC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlJlcXVlc3RpbmcgUmVwb3J0IGZyb20gU2VydmVyPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcInByb2dyZXNzIHByb2dyZXNzLXN0cmlwZWQgYWN0aXZlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwiYmFyXFxcIiBzdHlsZT1cXFwid2lkdGg6IDEwMCU7XFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGEgaHJlZj1cXFwiI1xcXCIgcmVsPVxcXCJkZXRhaWxzXFxcIj5kZXRhaWxzPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJkZXRhaWxzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxubW9kdWxlLmV4cG9ydHMgPSB0aGlzW1wiVGVtcGxhdGVzXCJdOyIsIlJlcG9ydFRhYiA9IHJlcXVpcmUgJ3JlcG9ydFRhYidcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5pZHMgPSByZXF1aXJlICcuL2lkcy5jb2ZmZWUnXG5mb3Iga2V5LCB2YWx1ZSBvZiBpZHNcbiAgd2luZG93W2tleV0gPSB2YWx1ZVxuXG5cblxuY2xhc3MgQXJyYXlGaXNoaW5nVmFsdWVUYWIgZXh0ZW5kcyBSZXBvcnRUYWJcbiAgbmFtZTogJ0Zpc2hpbmcgVmFsdWUnXG4gIGNsYXNzTmFtZTogJ2Zpc2hpbmdWYWx1ZSdcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5hcnJheUZpc2hpbmdWYWx1ZVxuICBkZXBlbmRlbmNpZXM6IFsnRmlzaGluZ1ZhbHVlJ11cbiAgdGltZW91dDogMjQwMDAwXG5cbiAgcmVuZGVyOiAoKSAtPlxuICAgIG51bVR5cGVzID0gMFxuICAgIHNhbmN0dWFyaWVzID0gQGdldENoaWxkcmVuIFNBTkNUVUFSWV9JRFxuICAgIGlmIHNhbmN0dWFyaWVzLmxlbmd0aFxuICAgICAgc2FuY3R1YXJ5UGVyY2VudCA9IEByZWNvcmRTZXQoXG4gICAgICAgICdGaXNoaW5nVmFsdWUnLCBcbiAgICAgICAgJ0Zpc2hpbmdWYWx1ZScsIFxuICAgICAgICBTQU5DVFVBUllfSURcbiAgICAgICkuZmxvYXQoJ1BFUkNFTlQnLCAyKVxuXG5cbiAgICBtb29yaW5ncyA9IEBnZXRDaGlsZHJlbiBNT09SSU5HX0lEXG4gICAgaWYgbW9vcmluZ3MubGVuZ3RoXG4gICAgICBtb29yaW5nUGVyY2VudCA9IEByZWNvcmRTZXQoXG4gICAgICAgICdGaXNoaW5nVmFsdWUnLCBcbiAgICAgICAgJ0Zpc2hpbmdWYWx1ZScsIFxuICAgICAgICBNT09SSU5HX0lEXG4gICAgICApLmZsb2F0KCdQRVJDRU5UJywgMilcblxuXG4gICAgbm9OZXRab25lcyA9IEBnZXRDaGlsZHJlbiBOT19ORVRfWk9ORVNfSURcbiAgICBpZiBub05ldFpvbmVzLmxlbmd0aFxuICAgICAgbm9OZXRab25lc1BlcmNlbnQgPSBAcmVjb3JkU2V0KFxuICAgICAgICAnRmlzaGluZ1ZhbHVlJywgXG4gICAgICAgICdGaXNoaW5nVmFsdWUnLCBcbiAgICAgICAgTk9fTkVUX1pPTkVTX0lEXG4gICAgICApLmZsb2F0KCdQRVJDRU5UJywgMClcblxuXG4gICAgc2hpcHBpbmdab25lcyA9IEBnZXRDaGlsZHJlbiBTSElQUElOR19aT05FX0lEXG4gICAgaWYgc2hpcHBpbmdab25lcy5sZW5ndGhcbiAgICAgIHNoaXBwaW5nWm9uZXNQZXJjZW50ID0gQHJlY29yZFNldChcbiAgICAgICAgJ0Zpc2hpbmdWYWx1ZScsIFxuICAgICAgICAnRmlzaGluZ1ZhbHVlJywgXG4gICAgICAgIFNISVBQSU5HX1pPTkVfSURcbiAgICAgICkuZmxvYXQoJ1BFUkNFTlQnLCAwKVxuXG4gICAgY29udGV4dCA9XG4gICAgICBza2V0Y2g6IEBtb2RlbC5mb3JUZW1wbGF0ZSgpXG4gICAgICBza2V0Y2hDbGFzczogQHNrZXRjaENsYXNzLmZvclRlbXBsYXRlKClcbiAgICAgIGF0dHJpYnV0ZXM6IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKClcbiAgICAgIGFkbWluOiBAcHJvamVjdC5pc0FkbWluIHdpbmRvdy51c2VyXG4gICAgICBzYW5jdHVhcnlQZXJjZW50OiBzYW5jdHVhcnlQZXJjZW50XG4gICAgICBudW1TYW5jdHVhcmllczogc2FuY3R1YXJpZXMubGVuZ3RoXG5cbiAgICAgIGhhc1NhbmN0dWFyaWVzOiBzYW5jdHVhcmllcz8ubGVuZ3RoID4gMFxuICAgICAgc2FuY1BsdXJhbDogc2FuY3R1YXJpZXM/Lmxlbmd0aCA+IDFcblxuICAgICAgbW9vcmluZ3NQZXJjZW50OiBtb29yaW5nUGVyY2VudFxuICAgICAgbnVtTW9vcmluZ3M6IG1vb3JpbmdzPy5sZW5ndGhcbiAgICAgIGhhc01vb3JpbmdzOiBtb29yaW5ncz8ubGVuZ3RoID4gMFxuICAgICAgbW9vcmluZ3NQbHVyYWw6IG1vb3JpbmdzPy5sZW5ndGggPiAxXG5cbiAgICAgIG5vTmV0Wm9uZXNQZXJjZW50OiBub05ldFpvbmVzUGVyY2VudFxuICAgICAgbnVtTm9OZXRab25lczogbm9OZXRab25lcz8ubGVuZ3RoXG4gICAgICBoYXNOb05ldFpvbmVzOiBub05ldFpvbmVzPy5sZW5ndGggPiAwXG4gICAgICBub05ldFpvbmVzUGx1cmFsOiBub05ldFpvbmVzPy5sZW5ndGggPiAxXG5cbiAgICAgIHNoaXBwaW5nWm9uZXNQZXJjZW50OiBzaGlwcGluZ1pvbmVzUGVyY2VudFxuICAgICAgbnVtU2hpcHBpbmdab25lczogc2hpcHBpbmdab25lcz8ubGVuZ3RoXG4gICAgICBoYXNTaGlwcGluZ1pvbmVzOiBzaGlwcGluZ1pvbmVzPy5sZW5ndGggPiAwXG4gICAgICBzaGlwcGluZ1pvbmVzUGx1cmFsOiBzaGlwcGluZ1pvbmVzPy5sZW5ndGggPiAxXG5cblxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHRlbXBsYXRlcylcbiAgICBAZW5hYmxlTGF5ZXJUb2dnbGVycyhAJGVsKVxuXG5cbm1vZHVsZS5leHBvcnRzID0gQXJyYXlGaXNoaW5nVmFsdWVUYWIiLCJSZXBvcnRUYWIgPSByZXF1aXJlICdyZXBvcnRUYWInXG50ZW1wbGF0ZXMgPSByZXF1aXJlICcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuaWRzID0gcmVxdWlyZSAnLi9pZHMuY29mZmVlJ1xuZm9yIGtleSwgdmFsdWUgb2YgaWRzXG4gIHdpbmRvd1trZXldID0gdmFsdWVcblxuY2xhc3MgQXJyYXlIYWJpdGF0VGFiIGV4dGVuZHMgUmVwb3J0VGFiXG4gIG5hbWU6ICdIYWJpdGF0J1xuICBjbGFzc05hbWU6ICdoYWJpdGF0J1xuICB0ZW1wbGF0ZTogdGVtcGxhdGVzLmFycmF5SGFiaXRhdHNcbiAgZGVwZW5kZW5jaWVzOiBbXG4gICAgJ0JhcmJ1ZGFIYWJpdGF0J1xuICAgICdNYXJ4YW5BbmFseXNpcydcbiAgXVxuICB0aW1lb3V0OiAyNDAwMDBcbiAgXG4gIHJlbmRlcjogKCkgLT5cblxuICAgIGRhdGEgPSBAcmVjb3JkU2V0KCdNYXJ4YW5BbmFseXNpcycsICdNYXJ4YW5BbmFseXNpcycpLnRvQXJyYXkoKVxuICAgICNyZXR1cm5Nc2cgPSBAcmVjb3JkU2V0KCdNYXJ4YW5BbmFseXNpcycsICdSZXN1bHRNc2cnKS5kYXRhWyd2YWx1ZSddXG4gICAgI2NvbnNvbGUubG9nKFwicmV0dXJuIG1zZyBpcyA6IFwiLCByZXR1cm5Nc2cpXG4gICAgI2NvbnNvbGUubG9nKFwiZGF0YSBpcyBcIiwgZGF0YSlcbiAgICAjY29uc29sZS5sb2coXCJhbmQgc2tldGNoIGNsYXNzIGlzIFwiLCBAc2tldGNoQ2xhc3MpXG4gICAgI2NvbnNvbGUubG9nKFwiLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cIilcbiAgICBzYW5jdHVhcmllcyA9IEBnZXRDaGlsZHJlbiBTQU5DVFVBUllfSURcbiAgICBpZiBzYW5jdHVhcmllcy5sZW5ndGhcbiAgICAgIHNhbmN0dWFyeSA9IEByZWNvcmRTZXQoJ0JhcmJ1ZGFIYWJpdGF0JywgJ0hhYml0YXRzJywgU0FOQ1RVQVJZX0lEKVxuICAgICAgICAudG9BcnJheSgpXG4gICAgICBmb3Igcm93IGluIHNhbmN0dWFyeVxuICAgICAgICBpZiBwYXJzZUZsb2F0KHJvdy5QZXJjZW50KSA+PSAzM1xuICAgICAgICAgIHJvdy5tZWV0c0dvYWwgPSB0cnVlXG5cblxuICAgIG1vb3JpbmdzID0gQGdldENoaWxkcmVuIE1PT1JJTkdfSURcbiAgICBpZiBtb29yaW5ncy5sZW5ndGhcbiAgICAgIG1vb3JpbmdEYXRhID0gQHJlY29yZFNldCgnQmFyYnVkYUhhYml0YXQnLCAnSGFiaXRhdHMnLCBNT09SSU5HX0lEKVxuICAgICAgICAudG9BcnJheSgpXG5cblxuICAgIG5vTmV0Wm9uZXMgPSBAZ2V0Q2hpbGRyZW4gTk9fTkVUX1pPTkVTX0lEXG4gICAgaWYgbm9OZXRab25lcy5sZW5ndGhcbiAgICAgIG5vTmV0Wm9uZXNEYXRhID0gQHJlY29yZFNldCgnQmFyYnVkYUhhYml0YXQnLCAnSGFiaXRhdHMnLCBcbiAgICAgICAgTk9fTkVUX1pPTkVTX0lEKS50b0FycmF5KClcblxuICAgIGNvbnRleHQgPVxuICAgICAgc2tldGNoOiBAbW9kZWwuZm9yVGVtcGxhdGUoKVxuICAgICAgc2tldGNoQ2xhc3M6IEBza2V0Y2hDbGFzcy5mb3JUZW1wbGF0ZSgpXG4gICAgICBhdHRyaWJ1dGVzOiBAbW9kZWwuZ2V0QXR0cmlidXRlcygpXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgbnVtU2FuY3R1YXJpZXM6IHNhbmN0dWFyaWVzLmxlbmd0aFxuICAgICAgc2FuY3R1YXJpZXM6IHNhbmN0dWFyaWVzLmxlbmd0aCA+IDBcbiAgICAgIHNhbmN0dWFyeUhhYml0YXQ6IHNhbmN0dWFyeVxuICAgICAgc2FuY3R1YXJ5UGx1cmFsOiBzYW5jdHVhcmllcy5sZW5ndGggPiAxXG4gICAgICBcbiAgICAgIG1vb3JpbmdzOiBtb29yaW5ncy5sZW5ndGggPiAwXG4gICAgICBudW1Nb29yaW5nczogbW9vcmluZ3MubGVuZ3RoXG4gICAgICBtb29yaW5nRGF0YTogbW9vcmluZ0RhdGFcbiAgICAgIG1vb3JpbmdQbHVyYWw6IG1vb3JpbmdzLmxlbmd0aCA+IDFcblxuICAgICAgaGFzTm9OZXRab25lczogbm9OZXRab25lcy5sZW5ndGggPiAwXG4gICAgICBudW1Ob05ldFpvbmVzOiBub05ldFpvbmVzLmxlbmd0aFxuICAgICAgbm9OZXRab25lc0RhdGE6IG5vTmV0Wm9uZXNEYXRhXG4gICAgICBub05ldFpvbmVzUGx1cmFsOiBub05ldFpvbmVzLmxlbmd0aCA+IDFcbiAgICAgIG1hcnhhbkFuYWx5c2VzOiBfLm1hcChAcmVjb3JkU2V0KFwiTWFyeGFuQW5hbHlzaXNcIiwgXCJNYXJ4YW5BbmFseXNpc1wiKVxuICAgICAgICAudG9BcnJheSgpLCAoZikgLT4gZi5OQU1FKVxuICAgIFxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHRlbXBsYXRlcylcbiAgICBAZW5hYmxlTGF5ZXJUb2dnbGVycyhAJGVsKVxuICAgIEAkKCcuY2hvc2VuJykuY2hvc2VuKHtkaXNhYmxlX3NlYXJjaF90aHJlc2hvbGQ6IDEwLCB3aWR0aDonNDAwcHgnfSlcbiAgICBAJCgnLmNob3NlbicpLmNoYW5nZSAoKSA9PlxuICAgICAgXy5kZWZlciBAcmVuZGVyTWFyeGFuQW5hbHlzaXNcbiAgICBAcmVuZGVyTWFyeGFuQW5hbHlzaXMoKVxuXG4gIHJlbmRlck1hcnhhbkFuYWx5c2lzOiAoKSA9PlxuICAgIGlmIHdpbmRvdy5kM1xuICAgICAgbmFtZSA9IEAkKCcuY2hvc2VuJykudmFsKClcbiAgICAgIHRyeVxuICAgICAgICAjaG9vayB1cCB0aGUgY2hlY2tib3hlcyBmb3IgbWFyeGFuIHNjZW5hcmlvIG5hbWVzXG4gICAgICAgIG5vZGVNYXAgPSB7XG4gICAgICAgICAgICBcIjFcIjpcIjUzM2RlMjBhYTQ5ODg2N2M1NmM2Y2JhNVwiXG4gICAgICAgICAgICBcIjJcIjpcIjUzM2RlMjBhYTQ5ODg2N2M1NmM2Y2JhN1wiXG4gICAgICAgICAgICBcIjNcIjpcIjUzM2RlMjBhYTQ5ODg2N2M1NmM2Y2JhOVwiXG4gICAgICAgICAgICBcIjRcIjpcIjUzM2RlMjBhYTQ5ODg2N2M1NmM2Y2JhYlwiXG4gICAgICAgICAgICBcIjVcIjpcIjUzM2RlMjBhYTQ5ODg2N2M1NmM2Y2JhZFwiXG4gICAgICAgICAgICBcIjZcIjpcIjUzM2RlMjBhYTQ5ODg2N2M1NmM2Y2JhZlwiXG4gICAgICAgICAgICBcIjdcIjpcIjUzM2RlMjBhYTQ5ODg2N2M1NmM2Y2JiMVwiXG4gICAgICAgICAgICBcIjhcIjpcIjUzM2RlMjBhYTQ5ODg2N2M1NmM2Y2JiM1wiXG4gICAgICAgICAgfVxuICAgICAgICBzY2VuYXJpb05hbWUgPSBuYW1lLnN1YnN0cmluZygwLDEpXG4gICAgICAgIG5vZGVJZCA9IG5vZGVNYXBbc2NlbmFyaW9OYW1lXVxuXG4gICAgICAgIHRvYyA9IHdpbmRvdy5hcHAuZ2V0VG9jKClcbiAgICAgICAgdmlldyA9IHRvYy5nZXRDaGlsZFZpZXdCeUlkKG5vZGVJZClcbiAgICAgICAgbm9kZSA9IHZpZXcubW9kZWxcbiAgICAgICAgaXNWaXNpYmxlID0gbm9kZS5nZXQoJ3Zpc2libGUnKVxuICAgICAgICBAJCgnLm1hcnhhbi1ub2RlJykuYXR0cignZGF0YS10b2dnbGUtbm9kZScsIG5vZGVJZClcbiAgICAgICAgQCQoJy5tYXJ4YW4tbm9kZScpLmRhdGEoJ3RvY0l0ZW0nLCB2aWV3KVxuICAgICAgICBAJCgnLm1hcnhhbi1ub2RlJykuYXR0cignY2hlY2tlZCcsIGlzVmlzaWJsZSlcbiAgICAgICAgQCQoJy5tYXJ4YW4tbm9kZScpLmF0dHIoJ2RhdGEtdmlzaWJsZScsIGlzVmlzaWJsZSlcbiAgICAgICAgQCQoJy5tYXJ4YW4tbm9kZScpLnRleHQoJ3Nob3cgXFwnU2NlbmFyaW8gJytzY2VuYXJpb05hbWUrJ1xcJyBtYXJ4YW4gbGF5ZXInKVxuICAgICAgY2F0Y2ggZVxuICAgICAgICBjb25zb2xlLmxvZyhcImVycm9yXCIsIGUpXG5cbiAgICAgIHJlY29yZHMgPSBAcmVjb3JkU2V0KFwiTWFyeGFuQW5hbHlzaXNcIiwgXCJNYXJ4YW5BbmFseXNpc1wiKS50b0FycmF5KClcbiAgICAgIHF1YW50aWxlX3JhbmdlID0ge1wiUTBcIjpcInZlcnkgbG93XCIsIFwiUTIwXCI6IFwibG93XCIsXCJRNDBcIjogXCJtaWRcIixcIlE2MFwiOiBcImhpZ2hcIixcIlE4MFwiOiBcInZlcnkgaGlnaFwifVxuICAgICAgZGF0YSA9IF8uZmluZCByZWNvcmRzLCAocmVjb3JkKSAtPiByZWNvcmQuTkFNRSBpcyBuYW1lXG5cbiAgICAgIHNjb3Jlc19kYXRhID0gW11cbiAgICAgIGZvciByZWMgaW4gcmVjb3Jkc1xuICAgICAgICAgaWYgcmVjLk5BTUUgPT0gbmFtZVxuICAgICAgICAgIHNjb3Jlc19kYXRhLnB1c2gocmVjKVxuICAgICAgXG4gICAgICBoaXN0byA9IGRhdGEuSElTVE8uc2xpY2UoMSwgZGF0YS5ISVNUTy5sZW5ndGggLSAxKS5zcGxpdCgvXFxzLylcbiAgICAgIGhpc3RvID0gXy5maWx0ZXIgaGlzdG8sIChzKSAtPiBzLmxlbmd0aCA+IDBcbiAgICAgIGhpc3RvID0gXy5tYXAgaGlzdG8sICh2YWwpIC0+XG4gICAgICAgIHBhcnNlSW50KHZhbClcbiAgICAgIHF1YW50aWxlcyA9IF8uZmlsdGVyKF8ua2V5cyhkYXRhKSwgKGtleSkgLT4ga2V5LmluZGV4T2YoJ1EnKSBpcyAwKVxuICAgICAgZm9yIHEsIGkgaW4gcXVhbnRpbGVzXG4gICAgICAgIGlmIHBhcnNlRmxvYXQoZGF0YVtxXSkgPiBwYXJzZUZsb2F0KGRhdGEuU0NPUkUpIG9yIGkgaXMgcXVhbnRpbGVzLmxlbmd0aCAtIDFcbiAgICAgICAgICBtYXhfcSA9IHF1YW50aWxlc1tpXVxuICAgICAgICAgIG1pbl9xID0gcXVhbnRpbGVzW2kgLSAxXSBvciBcIlEwXCIgIyBxdWFudGlsZXNbaV1cbiAgICAgICAgICBxdWFudGlsZV9kZXNjID0gcXVhbnRpbGVfcmFuZ2VbbWluX3FdXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgICBcbiAgICAgIEAkKCcuc2NlbmFyaW9SZXN1bHRzJykuaHRtbCBcIlwiXCJcbiAgICAgICAgPGEgaHJlZj1cImh0dHA6Ly93d3cudXEuZWR1LmF1L21hcnhhbi9cIiB0YXJnZXQ9XCJfYmxhbmtcIiA+TWFyeGFuPC9hPiBpcyBjb25zZXJ2YXRpb24gcGxhbm5pbmcgc29mdHdhcmUgdGhhdCBwcm92aWRlcyBkZWNpc2lvbiBzdXBwb3J0IGZvciBhIHJhbmdlIG9mIGNvbnNlcnZhdGlvbiBwbGFubmluZyBwcm9ibGVtcy4gXG4gICAgICAgIEluIHRoaXMgYW5hbHlzaXMsIHRoZSBnb2FsIGlzIHRvIG1heGltaXplIHRoZSBhbW91bnQgb2YgaGFiaXRhdCBjb25zZXJ2ZWQuIFRoZSBzY29yZSBmb3IgYSAyMDAgc3F1YXJlIG1ldGVyIHBsYW5uaW5nIHVuaXQgaXMgdGhlIG51bWJlciBvZiB0aW1lcyBpdCBpcyBzZWxlY3RlZCBpbiAxMDAgcnVucywgXG4gICAgICAgIHdpdGggaGlnaGVyIHNjb3JlcyBpbmRpY2F0aW5nIGdyZWF0ZXIgY29uc2VydmF0aW9uIHZhbHVlLiBUaGUgYXZlcmFnZSBNYXJ4YW4gc2NvcmUgZm9yIHRoaXMgY29sbGVjdGlvbiBpcyA8c3Ryb25nPiN7ZGF0YS5TQ09SRX08L3N0cm9uZz4sIHBsYWNpbmcgaXQgaW4gXG4gICAgICAgIHRoZSA8c3Ryb25nPiN7cXVhbnRpbGVfZGVzY308L3N0cm9uZz4gcXVhbnRpbGUgcmFuZ2UgPHN0cm9uZz4oI3ttaW5fcS5yZXBsYWNlKCdRJywgJycpfSUgLSAje21heF9xLnJlcGxhY2UoJ1EnLCAnJyl9JSk8L3N0cm9uZz4gXG4gICAgICAgIGZvciB0aGlzIHJlZ2lvbi4gVGhlIGdyYXBoIGJlbG93IHNob3dzIHRoZSBkaXN0cmlidXRpb24gb2Ygc2NvcmVzIGZvciBhbGwgcGxhbm5pbmcgdW5pdHMgd2l0aGluIHRoaXMgcHJvamVjdC5cbiAgICAgIFwiXCJcIlxuXG4gICAgICBAJCgnLnNjZW5hcmlvRGVzY3JpcHRpb24nKS5odG1sIGRhdGEuTUFSWF9ERVNDXG5cbiAgICAgIGRvbWFpbiA9IF8ubWFwIHF1YW50aWxlcywgKHEpIC0+IGRhdGFbcV1cbiAgICAgIGRvbWFpbi5wdXNoIDEwMFxuICAgICAgZG9tYWluLnVuc2hpZnQgMFxuICAgICAgY29sb3IgPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgICAgICAuZG9tYWluKGRvbWFpbilcbiAgICAgICAgLnJhbmdlKFtcIiM0N2FlNDNcIiwgXCIjNmMwXCIsIFwiI2VlMFwiLCBcIiNlYjRcIiwgXCIjZWNiYjg5XCIsIFwiI2VlYWJhMFwiXS5yZXZlcnNlKCkpXG4gICAgICBxdWFudGlsZXMgPSBfLm1hcCBxdWFudGlsZXMsIChrZXkpIC0+XG4gICAgICAgIG1heCA9IHBhcnNlRmxvYXQoZGF0YVtrZXldKVxuICAgICAgICBtaW4gID0gcGFyc2VGbG9hdChkYXRhW3F1YW50aWxlc1tfLmluZGV4T2YocXVhbnRpbGVzLCBrZXkpIC0gMV1dIG9yIDApXG4gICAgICAgIHtcbiAgICAgICAgICByYW5nZTogXCIje3BhcnNlSW50KGtleS5yZXBsYWNlKCdRJywgJycpKSAtIDIwfS0je2tleS5yZXBsYWNlKCdRJywgJycpfSVcIlxuICAgICAgICAgIG5hbWU6IGtleVxuICAgICAgICAgIHN0YXJ0OiBtaW5cbiAgICAgICAgICBlbmQ6IG1heFxuICAgICAgICAgIGJnOiBjb2xvcigobWF4ICsgbWluKSAvIDIpXG4gICAgICAgIH1cblxuICAgICAgQCQoJy52aXonKS5odG1sKCcnKVxuICAgICAgZWwgPSBAJCgnLnZpeicpWzBdXG4gICAgICB4ID0gZDMuc2NhbGUubGluZWFyKClcbiAgICAgICAgLmRvbWFpbihbMCwgMTAwXSlcbiAgICAgICAgLnJhbmdlKFswLCA0MDBdKSAgICAgIFxuXG4gICAgICAjIEhpc3RvZ3JhbVxuICAgICAgbWFyZ2luID0gXG4gICAgICAgIHRvcDogNVxuICAgICAgICByaWdodDogMjBcbiAgICAgICAgYm90dG9tOiAzMFxuICAgICAgICBsZWZ0OiA0NVxuICAgICAgd2lkdGggPSA0MDAgLSBtYXJnaW4ubGVmdCAtIG1hcmdpbi5yaWdodFxuICAgICAgaGVpZ2h0ID0gMzUwIC0gbWFyZ2luLnRvcCAtIG1hcmdpbi5ib3R0b21cblxuICAgICAgeCA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgICAgIC5kb21haW4oWzAsIDEwMF0pXG4gICAgICAgIC5yYW5nZShbMCwgd2lkdGhdKVxuICAgICAgeSA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgICAgIC5yYW5nZShbaGVpZ2h0LCAwXSlcbiAgICAgICAgLmRvbWFpbihbMCwgZDMubWF4KGhpc3RvKSs1MF0pXG5cbiAgICAgIHhBeGlzID0gZDMuc3ZnLmF4aXMoKVxuICAgICAgICAuc2NhbGUoeClcbiAgICAgICAgLm9yaWVudChcImJvdHRvbVwiKVxuICAgICAgeUF4aXMgPSBkMy5zdmcuYXhpcygpXG4gICAgICAgIC5zY2FsZSh5KVxuICAgICAgICAub3JpZW50KFwibGVmdFwiKVxuXG4gICAgICBzdmcgPSBkMy5zZWxlY3QoQCQoJy52aXonKVswXSkuYXBwZW5kKFwic3ZnXCIpXG4gICAgICAgIC5hdHRyKFwid2lkdGhcIiwgd2lkdGggKyBtYXJnaW4ubGVmdCArIG1hcmdpbi5yaWdodClcbiAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0ICsgbWFyZ2luLnRvcCArIG1hcmdpbi5ib3R0b20pXG4gICAgICAuYXBwZW5kKFwiZ1wiKVxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgje21hcmdpbi5sZWZ0fSwgI3ttYXJnaW4udG9wfSlcIilcblxuICAgICAgc3ZnLmFwcGVuZChcImdcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInggYXhpc1wiKVxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLCN7aGVpZ2h0fSlcIilcbiAgICAgICAgLmNhbGwoeEF4aXMpXG4gICAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAuYXR0cihcInhcIiwgd2lkdGggLyAyKVxuICAgICAgICAuYXR0cihcImR5XCIsIFwiM2VtXCIpXG4gICAgICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXG4gICAgICAgIC50ZXh0KFwiU2NvcmVcIilcblxuICAgICAgc3ZnLmFwcGVuZChcImdcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInkgYXhpc1wiKVxuICAgICAgICAuY2FsbCh5QXhpcylcbiAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwicm90YXRlKC05MClcIilcbiAgICAgICAgLmF0dHIoXCJ5XCIsIDYpXG4gICAgICAgIC5hdHRyKFwiZHlcIiwgXCIuNzFlbVwiKVxuICAgICAgICAuc3R5bGUoXCJ0ZXh0LWFuY2hvclwiLCBcImVuZFwiKVxuICAgICAgICAudGV4dChcIk51bWJlciBvZiBQbGFubmluZyBVbml0c1wiKVxuXG4gICAgICBzdmcuc2VsZWN0QWxsKFwiLmJhclwiKVxuICAgICAgICAgIC5kYXRhKGhpc3RvKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJyZWN0XCIpXG4gICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImJhclwiKVxuICAgICAgICAgIC5hdHRyKFwieFwiLCAoZCwgaSkgLT4geChpKSlcbiAgICAgICAgICAuYXR0cihcIndpZHRoXCIsICh3aWR0aCAvIDEwMCkpXG4gICAgICAgICAgLmF0dHIoXCJ5XCIsIChkKSAtPiB5KGQpKVxuICAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIChkKSAtPiBoZWlnaHQgLSB5KGQpKVxuICAgICAgICAgIC5zdHlsZSAnZmlsbCcsIChkLCBpKSAtPlxuICAgICAgICAgICAgcSA9IF8uZmluZCBxdWFudGlsZXMsIChxKSAtPlxuICAgICAgICAgICAgICBpID49IHEuc3RhcnQgYW5kIGkgPD0gcS5lbmRcbiAgICAgICAgICAgIHE/LmJnIG9yIFwic3RlZWxibHVlXCJcblxuICAgICAgI3NvcnQgdGhlIG92ZXJsYXBwaW5nIHNjb3JlcyBpbnRvIGEgbWFwIG9mIHNjb3Jlcy0+YXJyYXkgb2YgcHJvcG9zYWwgaWRzXG4gICAgICBzY29yZV9tYXAgID0gW11cbiAgICAgIGZvciBzZGF0YSBpbiBzY29yZXNfZGF0YVxuICAgICAgICBjdXJyX3Njb3JlID0gTWF0aC5yb3VuZChzZGF0YS5TQ09SRSlcbiAgICAgICAgY3Vycl9wcm9wb3NhbCA9IHNkYXRhLlBST1BPU0FMXG4gICAgICAgIHNjb3JlcyA9IE9iamVjdC5rZXlzKHNjb3JlX21hcClcbiAgICAgICAgaWYgY3Vycl9zY29yZS50b1N0cmluZygpIGluIHNjb3Jlc1xuICAgICAgICAgIHByb3BfaWRzID0gc2NvcmVfbWFwW2N1cnJfc2NvcmVdXG4gICAgICAgICAgcHJvcF9pZHMucHVzaChjdXJyX3Byb3Bvc2FsKVxuICAgICAgICAgIHNjb3JlX21hcFtjdXJyX3Njb3JlXSA9IHByb3BfaWRzXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBzY29yZV9tYXBbY3Vycl9zY29yZV0gPSBbY3Vycl9wcm9wb3NhbF1cblxuICAgICAgZm9yIHNkYXRhLCBwcm9wb3NhbHMgb2Ygc2NvcmVfbWFwXG4gICAgICAgIHN2Zy5zZWxlY3RBbGwoXCIuc2NvcmVcIitzZGF0YSlcbiAgICAgICAgICAgIC5kYXRhKFtzZGF0YV0pXG4gICAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJzY29yZVwiKVxuICAgICAgICAgIC5hdHRyKFwieFwiLCAoZCkgLT4gKHgoZCkgLSA4ICkrICdweCcpXG4gICAgICAgICAgLmF0dHIoXCJ5XCIsIChkKSAtPiAoeShoaXN0b1tkXSkgLSAxKSArICdweCcpXG4gICAgICAgICAgLnRleHQoXCLilrxcIilcblxuICAgICAgZm9yIHNkYXRhLCBwcm9wb3NhbHMgb2Ygc2NvcmVfbWFwXG4gICAgICAgIGlmIHByb3Bvc2Fscy5sZW5ndGggPT0gMVxuICAgICAgICAgIHBuYW1lID0gd2luZG93LmFwcC5za2V0Y2hlcy5nZXQocHJvcG9zYWxzWzBdKS5hdHRyaWJ1dGVzLm5hbWVcbiAgICAgICAgICBzdmcuc2VsZWN0QWxsKFwiLnNjb3JlVGV4dFwiK3NkYXRhKVxuICAgICAgICAgICAgICAuZGF0YShbc2RhdGFdKVxuICAgICAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInNjb3JlVGV4dFwiKVxuICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIChkKSAtPiAoeChkKSAtIDYgKSsgJ3B4JylcbiAgICAgICAgICAgIC5hdHRyKFwieVwiLCAoZCkgLT4gKHkoaGlzdG9bZF0pIC0gMTgpICsgJ3B4JylcbiAgICAgICAgICAgIC50ZXh0KChkKSAtPiBkK1wiOiBcIitwbmFtZSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHlvZmZzZXQgPSAtMThcbiAgICAgICAgICBmb3IgcCBpbiBwcm9wb3NhbHNcbiAgICAgICAgICAgIHBuYW1lID0gd2luZG93LmFwcC5za2V0Y2hlcy5nZXQocCkuYXR0cmlidXRlcy5uYW1lXG4gICAgICAgICAgICBpZiB5b2Zmc2V0ID09IC0xOFxuICAgICAgICAgICAgICAjZmlyc3Qgb25lLCBzbyBpbnNlcnQgdGhlIHRleHQgc2NvcmVcbiAgICAgICAgICAgICAgc3ZnLnNlbGVjdEFsbChcIi5zY29yZVRleHRcIitzZGF0YStwKVxuICAgICAgICAgICAgICAgICAgLmRhdGEoW3NkYXRhXSlcbiAgICAgICAgICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInNjb3JlVGV4dFwiKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwieFwiLCAoZCkgLT4gKHgoZCkgLSA2ICkrICdweCcpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIChkKSAtPiAoeShoaXN0b1tkXSkgKyB5b2Zmc2V0KSArICdweCcpXG4gICAgICAgICAgICAgICAgLnRleHQoKGQpIC0+IFwiUHJvcG9zYWxzIHdpdGggc2NvcmUgXCIrZCtcIjpcIilcbiAgICAgICAgICAgIHlvZmZzZXQrPTEyXG4gICAgICAgICAgICBzdmcuc2VsZWN0QWxsKFwiLnNjb3JlVGV4dFwiK3ApXG4gICAgICAgICAgICAgICAgLmRhdGEoW3NkYXRhXSlcbiAgICAgICAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwic2NvcmVUZXh0XCIpXG4gICAgICAgICAgICAgIC5hdHRyKFwieFwiLCAoZCkgLT4gKHgoZCkgKyAxMCApKyAncHgnKVxuICAgICAgICAgICAgICAuYXR0cihcInlcIiwgKGQpIC0+ICh5KGhpc3RvW2RdKSArIHlvZmZzZXQpICsgJ3B4JylcbiAgICAgICAgICAgICAgLnRleHQoKGQpIC0+IHBuYW1lKVxuICAgICAgICAgICAgeW9mZnNldCs9MVxuXG5cbiAgICAgIEAkKCcudml6JykuYXBwZW5kICc8ZGl2IGNsYXNzPVwibGVnZW5kc1wiPjwvZGl2PidcbiAgICAgIGZvciBxdWFudGlsZSBpbiBxdWFudGlsZXNcbiAgICAgICAgQCQoJy52aXogLmxlZ2VuZHMnKS5hcHBlbmQgXCJcIlwiXG4gICAgICAgICAgPGRpdiBjbGFzcz1cImxlZ2VuZFwiPjxzcGFuIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjoje3F1YW50aWxlLmJnfTtcIj4mbmJzcDs8L3NwYW4+I3txdWFudGlsZS5yYW5nZX08L2Rpdj5cbiAgICAgICAgXCJcIlwiXG4gICAgICBAJCgnLnZpeicpLmFwcGVuZCAnPGJyIHN0eWxlPVwiY2xlYXI6Ym90aDtcIj4nXG5tb2R1bGUuZXhwb3J0cyA9IEFycmF5SGFiaXRhdFRhYiIsIlJlcG9ydFRhYiA9IHJlcXVpcmUgJ3JlcG9ydFRhYidcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5pZHMgPSByZXF1aXJlICcuL2lkcy5jb2ZmZWUnXG5mb3Iga2V5LCB2YWx1ZSBvZiBpZHNcbiAgd2luZG93W2tleV0gPSB2YWx1ZVxuXG5yb3VuZCA9IHJlcXVpcmUoJ2FwaS91dGlscycpLnJvdW5kXG5UT1RBTF9BUkVBID0gMTY0LjggIyBzcSBtaWxlc1xuVE9UQUxfTEFHT09OX0FSRUEgPSAxMS4xXG5fcGFydGlhbHMgPSByZXF1aXJlICdhcGkvdGVtcGxhdGVzJ1xucGFydGlhbHMgPSBbXVxuZm9yIGtleSwgdmFsIG9mIF9wYXJ0aWFsc1xuICBwYXJ0aWFsc1trZXkucmVwbGFjZSgnbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpLycsICcnKV0gPSB2YWxcblxuY2xhc3MgQXJyYXlPdmVydmlld1RhYiBleHRlbmRzIFJlcG9ydFRhYlxuICBuYW1lOiAnT3ZlcnZpZXcnXG4gIGNsYXNzTmFtZTogJ292ZXJ2aWV3J1xuICB0ZW1wbGF0ZTogdGVtcGxhdGVzLmFycmF5T3ZlcnZpZXdcbiAgZGVwZW5kZW5jaWVzOiBbJ0RpYW1ldGVyJ11cbiAgdGltZW91dDogMTIwMDAwXG5cbiAgcmVuZGVyOiAoKSAtPlxuXG4gICAgc2FuY3R1YXJpZXMgPSBbXVxuICAgIGFxdWFjdWx0dXJlQXJlYXMgPSBbXVxuICAgIG1vb3JpbmdzID0gW11cbiAgICBub05ldFpvbmVzID0gW11cbiAgICBmaXNoaW5nQXJlYXMgPSBbXVxuXG5cbiAgICBzYW5jdHVhcmllcyA9IEBnZXRDaGlsZHJlbiBTQU5DVFVBUllfSURcbiAgICBudW1TYW5jdHVhcmllcyA9IHNhbmN0dWFyaWVzLmxlbmd0aFxuICAgIGlmIG51bVNhbmN0dWFyaWVzID4gMFxuICAgICAgc2FuY3R1YXJ5T2NlYW5BcmVhID0gQHJlY29yZFNldChcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICBTQU5DVFVBUllfSURcbiAgICAgICkuZmxvYXQoJ09DRUFOX0FSRUEnLCAxKVxuICAgICAgc2FuY3R1YXJ5TGFnb29uQXJlYSA9IEByZWNvcmRTZXQoXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgU0FOQ1RVQVJZX0lEXG4gICAgICApLmZsb2F0KCdMQUdPT05fQVJFQScsIDEpXG4gICAgICBzYW5jdHVhcnlPY2VhblBlcmNlbnQgPSBAcmVjb3JkU2V0KFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgIFNBTkNUVUFSWV9JRFxuICAgICAgKS5mbG9hdCgnT0NFQU5fUEVSQ0VOVCcsIDEpXG4gICAgICBzYW5jdHVhcnlMYWdvb25QZXJjZW50ID0gQHJlY29yZFNldChcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICBTQU5DVFVBUllfSURcbiAgICAgICkuZmxvYXQoJ0xBR09PTl9QRVJDRU5UJywgMSlcbiAgICBlbHNlXG4gICAgICBzYW5jdHVhcnlPY2VhbkFyZWEgPSAwXG4gICAgICBzYW5jdHVhcnlPY2VhblBlcmNlbnQgPSAwLjBcbiAgICAgIHNhbmN0dWFyeUxhZ29vbkFyZWEgPSAwXG4gICAgICBzYW5jdHVhcnlMYWdvb25QZXJjZW50ID0gMC4wXG5cbiAgICBhcXVhY3VsdHVyZUFyZWFzID0gQGdldENoaWxkcmVuIEFRVUFDVUxUVVJFX0lEXG4gICAgbnVtQXF1YWN1bHR1cmVBcmVhcyA9IGFxdWFjdWx0dXJlQXJlYXMubGVuZ3RoXG4gICAgaWYgbnVtQXF1YWN1bHR1cmVBcmVhcyA+IDBcbiAgICAgIGFxdWFjdWx0dXJlT2NlYW5BcmVhID0gQHJlY29yZFNldChcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICBBUVVBQ1VMVFVSRV9JRFxuICAgICAgKS5mbG9hdCgnT0NFQU5fQVJFQScsIDEpXG4gICAgICBhcXVhY3VsdHVyZUxhZ29vbkFyZWEgPSBAcmVjb3JkU2V0KFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgIEFRVUFDVUxUVVJFX0lEXG4gICAgICApLmZsb2F0KCdMQUdPT05fQVJFQScsIDEpXG4gICAgICBhcXVhY3VsdHVyZU9jZWFuUGVyY2VudCA9IEByZWNvcmRTZXQoXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgQVFVQUNVTFRVUkVfSURcbiAgICAgICkuZmxvYXQoJ09DRUFOX1BFUkNFTlQnLCAxKVxuICAgICAgYXF1YWN1bHR1cmVMYWdvb25QZXJjZW50ID0gQHJlY29yZFNldChcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICBBUVVBQ1VMVFVSRV9JRFxuICAgICAgKS5mbG9hdCgnTEFHT09OX1BFUkNFTlQnLCAxKVxuICAgIGVsc2VcbiAgICAgIGFxdWFjdWx0dXJlT2NlYW5BcmVhID0gMFxuICAgICAgYXF1YWN1bHR1cmVPY2VhblBlcmNlbnQgPSAwLjBcbiAgICAgIGFxdWFjdWx0dXJlTGFnb29uQXJlYSA9IDBcbiAgICAgIGFxdWFjdWx0dXJlTGFnb29uUGVyY2VudCA9IDAuMFxuXG4gICAgbW9vcmluZ3MgPSAgQGdldENoaWxkcmVuIE1PT1JJTkdfSURcbiAgICBudW1Nb29yaW5ncyA9IG1vb3JpbmdzLmxlbmd0aFxuICAgIGlmIG51bU1vb3JpbmdzID4gMFxuICAgICAgbW9vcmluZ3NPY2VhbkFyZWEgPSBAcmVjb3JkU2V0KFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgIE1PT1JJTkdfSURcbiAgICAgICkuZmxvYXQoJ09DRUFOX0FSRUEnLCAxKVxuICAgICAgbW9vcmluZ3NMYWdvb25BcmVhID0gQHJlY29yZFNldChcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICBNT09SSU5HX0lEXG4gICAgICApLmZsb2F0KCdMQUdPT05fQVJFQScsIDEpXG4gICAgICBtb29yaW5nc09jZWFuUGVyY2VudCA9IEByZWNvcmRTZXQoXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgTU9PUklOR19JRFxuICAgICAgKS5mbG9hdCgnT0NFQU5fUEVSQ0VOVCcsIDEpXG4gICAgICBtb29yaW5nc0xhZ29vblBlcmNlbnQgPSBAcmVjb3JkU2V0KFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgIE1PT1JJTkdfSURcbiAgICAgICkuZmxvYXQoJ0xBR09PTl9QRVJDRU5UJywgMSlcbiAgICBlbHNlXG4gICAgICBtb29yaW5nc09jZWFuQXJlYSA9IDBcbiAgICAgIG1vb3JpbmdzT2NlYW5QZXJjZW50ID0gMC4wXG4gICAgICBtb29yaW5nc0xhZ29vbkFyZWEgPSAwXG4gICAgICBtb29yaW5nc0xhZ29vblBlcmNlbnQgPSAwLjBcblxuICAgIG5vTmV0Wm9uZXMgPSBAZ2V0Q2hpbGRyZW4gTk9fTkVUX1pPTkVTX0lEXG4gICAgbnVtTm9OZXRab25lcyA9IG5vTmV0Wm9uZXMubGVuZ3RoXG4gICAgaWYgbnVtTm9OZXRab25lcyA+IDBcbiAgICAgIG5vTmV0Wm9uZXNPY2VhbkFyZWEgPSBAcmVjb3JkU2V0KFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgIE5PX05FVF9aT05FU19JRFxuICAgICAgKS5mbG9hdCgnT0NFQU5fQVJFQScsIDEpXG4gICAgICBub05ldFpvbmVzTGFnb29uQXJlYSA9IEByZWNvcmRTZXQoXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgTk9fTkVUX1pPTkVTX0lEXG4gICAgICApLmZsb2F0KCdMQUdPT05fQVJFQScsIDEpIFxuICAgICAgbm9OZXRab25lc09jZWFuUGVyY2VudCA9IEByZWNvcmRTZXQoXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgTk9fTkVUX1pPTkVTX0lEXG4gICAgICApLmZsb2F0KCdPQ0VBTl9QRVJDRU5UJywgMSlcbiAgICAgIG5vTmV0Wm9uZXNMYWdvb25QZXJjZW50ID0gQHJlY29yZFNldChcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICBOT19ORVRfWk9ORVNfSURcbiAgICAgICkuZmxvYXQoJ0xBR09PTl9QRVJDRU5UJywgMSkgXG4gICAgZWxzZVxuICAgICAgbm9OZXRab25lc09jZWFuQXJlYSA9IDBcbiAgICAgIG5vTmV0Wm9uZXNPY2VhblBlcmNlbnQgPSAwLjBcbiAgICAgIG5vTmV0Wm9uZXNMYWdvb25BcmVhID0gMFxuICAgICAgbm9OZXRab25lc0xhZ29vblBlcmNlbnQgPSAwLjBcblxuXG4gICAgbnVtVG90YWxab25lcyA9IG51bVNhbmN0dWFyaWVzK251bU5vTmV0Wm9uZXMrbnVtQXF1YWN1bHR1cmVBcmVhcytudW1Nb29yaW5nc1xuICAgIHN1bU9jZWFuQXJlYSA9IHJvdW5kKHNhbmN0dWFyeU9jZWFuQXJlYStub05ldFpvbmVzT2NlYW5BcmVhK2FxdWFjdWx0dXJlT2NlYW5BcmVhK21vb3JpbmdzT2NlYW5BcmVhLCAxKVxuICAgIHN1bU9jZWFuUGVyY2VudCA9IHJvdW5kKHNhbmN0dWFyeU9jZWFuUGVyY2VudCtub05ldFpvbmVzT2NlYW5QZXJjZW50K2FxdWFjdWx0dXJlT2NlYW5QZXJjZW50K21vb3JpbmdzT2NlYW5QZXJjZW50LDApXG4gICAgc3VtTGFnb29uQXJlYSA9IHJvdW5kKHNhbmN0dWFyeUxhZ29vbkFyZWErbm9OZXRab25lc0xhZ29vbkFyZWErYXF1YWN1bHR1cmVMYWdvb25BcmVhK21vb3JpbmdzTGFnb29uQXJlYSwgMSlcbiAgICBzdW1MYWdvb25QZXJjZW50ID0gcm91bmQoc2FuY3R1YXJ5TGFnb29uUGVyY2VudCtub05ldFpvbmVzTGFnb29uUGVyY2VudCthcXVhY3VsdHVyZUxhZ29vblBlcmNlbnQrbW9vcmluZ3NMYWdvb25QZXJjZW50LCAwKVxuICAgIGhhc1NrZXRjaGVzID0gbnVtVG90YWxab25lcyA+IDBcblxuICAgIGNvbnRleHQgPVxuICAgICAgc2tldGNoOiBAbW9kZWwuZm9yVGVtcGxhdGUoKVxuICAgICAgc2tldGNoQ2xhc3M6IEBza2V0Y2hDbGFzcy5mb3JUZW1wbGF0ZSgpXG4gICAgICBhdHRyaWJ1dGVzOiBAbW9kZWwuZ2V0QXR0cmlidXRlcygpXG4gICAgICBhbnlBdHRyaWJ1dGVzOiBAbW9kZWwuZ2V0QXR0cmlidXRlcygpLmxlbmd0aCA+IDBcbiAgICAgIGFkbWluOiBAcHJvamVjdC5pc0FkbWluIHdpbmRvdy51c2VyXG5cbiAgICAgIG51bVNhbmN0dWFyaWVzOiBzYW5jdHVhcmllcy5sZW5ndGhcbiAgICAgIGhhc1NhbmN0dWFyaWVzOiBzYW5jdHVhcmllcy5sZW5ndGggPiAwXG4gICAgICBzYW5jdHVhcmllc1BsdXJhbDogc2FuY3R1YXJpZXMubGVuZ3RoID4gMVxuICAgICAgc2FuY3R1YXJ5T2NlYW5QZXJjZW50OiByb3VuZChzYW5jdHVhcnlPY2VhblBlcmNlbnQsIDIpXG4gICAgICBzYW5jdHVhcnlPY2VhbkFyZWE6IHJvdW5kKHNhbmN0dWFyeU9jZWFuQXJlYSwgMSlcbiAgICAgIHNhbmN0dWFyeUxhZ29vbkFyZWE6IHJvdW5kKHNhbmN0dWFyeUxhZ29vbkFyZWEsIDIpXG4gICAgICBzYW5jdHVhcnlMYWdvb25QZXJjZW50OiByb3VuZChzYW5jdHVhcnlMYWdvb25QZXJjZW50LCAxKVxuICAgICAgXG4gICAgICBudW1Ob05ldFpvbmVzOiBub05ldFpvbmVzLmxlbmd0aFxuICAgICAgaGFzTm9OZXRab25lczogbm9OZXRab25lcy5sZW5ndGggPiAwXG4gICAgICBub05ldFpvbmVzUGx1cmFsOiBub05ldFpvbmVzLmxlbmd0aCA+IDFcbiAgICAgIG5vTmV0Wm9uZXNPY2VhblBlcmNlbnQ6IHJvdW5kKG5vTmV0Wm9uZXNPY2VhblBlcmNlbnQsIDIpXG4gICAgICBub05ldFpvbmVzT2NlYW5BcmVhOiByb3VuZChub05ldFpvbmVzT2NlYW5BcmVhLCAxKVxuICAgICAgbm9OZXRab25lc0xhZ29vbkFyZWE6IHJvdW5kKG5vTmV0Wm9uZXNMYWdvb25BcmVhLCAyKVxuICAgICAgbm9OZXRab25lc0xhZ29vblBlcmNlbnQ6IHJvdW5kKG5vTmV0Wm9uZXNMYWdvb25QZXJjZW50LCAxKVxuXG4gICAgICBudW1BcXVhY3VsdHVyZTogYXF1YWN1bHR1cmVBcmVhcy5sZW5ndGhcbiAgICAgIGhhc0FxdWFjdWx0dXJlOiBhcXVhY3VsdHVyZUFyZWFzLmxlbmd0aCA+IDBcbiAgICAgIGFxdWFjdWx0dXJlUGx1cmFsOiBhcXVhY3VsdHVyZUFyZWFzLmxlbmd0aCA+IDFcbiAgICAgIGFxdWFjdWx0dXJlT2NlYW5QZXJjZW50OiByb3VuZChhcXVhY3VsdHVyZU9jZWFuUGVyY2VudCwgMilcbiAgICAgIGFxdWFjdWx0dXJlT2NlYW5BcmVhOiByb3VuZChhcXVhY3VsdHVyZU9jZWFuQXJlYSwgMSlcbiAgICAgIGFxdWFjdWx0dXJlTGFnb29uQXJlYTogcm91bmQoYXF1YWN1bHR1cmVMYWdvb25BcmVhLCAyKVxuICAgICAgYXF1YWN1bHR1cmVMYWdvb25QZXJjZW50OiByb3VuZChhcXVhY3VsdHVyZUxhZ29vblBlcmNlbnQsIDEpXG5cbiAgICAgIG51bU1vb3JpbmdzOiBtb29yaW5ncy5sZW5ndGhcbiAgICAgIGhhc01vb3JpbmdzOiBtb29yaW5ncy5sZW5ndGggPiAwXG4gICAgICBtb29yaW5nc1BsdXJhbDogbW9vcmluZ3MubGVuZ3RoID4gMVxuICAgICAgbW9vcmluZ3NPY2VhblBlcmNlbnQ6IHJvdW5kKG1vb3JpbmdzT2NlYW5QZXJjZW50LCAyKVxuICAgICAgbW9vcmluZ3NPY2VhbkFyZWE6IHJvdW5kKG1vb3JpbmdzT2NlYW5BcmVhLCAxKVxuICAgICAgbW9vcmluZ3NMYWdvb25BcmVhOiByb3VuZChtb29yaW5nc0xhZ29vbkFyZWEsIDIpXG4gICAgICBtb29yaW5nc0xhZ29vblBlcmNlbnQ6IHJvdW5kKG1vb3JpbmdzTGFnb29uUGVyY2VudCwgMSlcblxuXG4gICAgICBoYXNTa2V0Y2hlczogaGFzU2tldGNoZXNcbiAgICAgIHNrZXRjaGVzUGx1cmFsOiBudW1Ub3RhbFpvbmVzID4gMVxuICAgICAgbnVtU2tldGNoZXM6IG51bVRvdGFsWm9uZXNcbiAgICAgIHN1bU9jZWFuQXJlYTogc3VtT2NlYW5BcmVhXG4gICAgICBzdW1PY2VhblBlcmNlbnQ6IHN1bU9jZWFuUGVyY2VudFxuICAgICAgc3VtTGFnb29uUGVyY2VudDogc3VtTGFnb29uUGVyY2VudFxuICAgICAgc3VtTGFnb29uQXJlYTogc3VtTGFnb29uQXJlYVxuICAgIFxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHBhcnRpYWxzKVxuXG4gICAgIyBub2RlcyA9IFtAbW9kZWxdXG4gICAgIyBAbW9kZWwuc2V0ICdvcGVuJywgdHJ1ZVxuICAgICMgbm9kZXMgPSBub2Rlcy5jb25jYXQgQGNoaWxkcmVuXG4gICAgIyBjb25zb2xlLmxvZyAnbm9kZXMnLCBub2RlcywgJ2NoaWxkcmVuJywgQGNoaWxkcmVuXG4gICAgIyBmb3Igbm9kZSBpbiBub2Rlc1xuICAgICMgICBub2RlLnNldCAnc2VsZWN0ZWQnLCBmYWxzZVxuICAgICMgVGFibGVPZkNvbnRlbnRzID0gd2luZG93LnJlcXVpcmUoJ3ZpZXdzL3RhYmxlT2ZDb250ZW50cycpXG4gICAgIyBAdG9jID0gbmV3IFRhYmxlT2ZDb250ZW50cyhub2RlcylcbiAgICAjIEAkKCcudG9jQ29udGFpbmVyJykuYXBwZW5kIEB0b2MuZWxcbiAgICAjIEB0b2MucmVuZGVyKClcblxuICByZW1vdmU6ICgpIC0+XG4gICAgQHRvYz8ucmVtb3ZlKClcbiAgICBzdXBlcigpXG5cbm1vZHVsZS5leHBvcnRzID0gQXJyYXlPdmVydmlld1RhYiIsIlJlcG9ydFRhYiA9IHJlcXVpcmUgJ3JlcG9ydFRhYidcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5yb3VuZCA9IHJlcXVpcmUoJ2FwaS91dGlscycpLnJvdW5kXG5UT1RBTF9BUkVBID0gMTY0LjggIyBzcSBtaWxlc1xuVE9UQUxfTEFHT09OX0FSRUEgPSAxMS4xXG5fcGFydGlhbHMgPSByZXF1aXJlICdhcGkvdGVtcGxhdGVzJ1xucGFydGlhbHMgPSBbXVxuZm9yIGtleSwgdmFsIG9mIF9wYXJ0aWFsc1xuICBwYXJ0aWFsc1trZXkucmVwbGFjZSgnbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpLycsICcnKV0gPSB2YWxcblxuY2xhc3MgQXJyYXlUcmFkZW9mZnNUYWIgZXh0ZW5kcyBSZXBvcnRUYWJcbiAgbmFtZTogJ1RyYWRlb2ZmcydcbiAgY2xhc3NOYW1lOiAndHJhZGVvZmZzJ1xuICB0ZW1wbGF0ZTogdGVtcGxhdGVzLmFycmF5VHJhZGVvZmZzXG4gIGRlcGVuZGVuY2llczogWydUcmFkZW9mZnNQcm9wSWQnXVxuICB0aW1lb3V0OiAxMjAwMDBcblxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICAgIFxuICAgIHRyYWRlb2ZmX2RhdGEgPSBAcmVjb3JkU2V0KCdUcmFkZW9mZnNQcm9wSWQnLCAnVHJhZGVvZmZzUHJvcElkJykudG9BcnJheSgpXG4gICAgY29uc29sZS5sb2coXCJ0cmFkZW9mZiBkYXRhOiBcIiwgdHJhZGVvZmZfZGF0YSlcbiAgICBjb250ZXh0ID1cbiAgICAgIHNrZXRjaDogQG1vZGVsLmZvclRlbXBsYXRlKClcbiAgICAgIHNrZXRjaENsYXNzOiBAc2tldGNoQ2xhc3MuZm9yVGVtcGxhdGUoKVxuICAgICAgYXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKVxuICAgICAgYWRtaW46IEBwcm9qZWN0LmlzQWRtaW4gd2luZG93LnVzZXJcbiAgICBAJGVsLmh0bWwgQHRlbXBsYXRlLnJlbmRlcihjb250ZXh0LCBwYXJ0aWFscylcblxuICAgIGlmIHdpbmRvdy5kM1xuXG4gICAgICBoID0gMzgwXG4gICAgICB3ID0gMzgwXG4gICAgICBtYXJnaW4gPSB7bGVmdDo0MCwgdG9wOjUsIHJpZ2h0OjQwLCBib3R0b206IDQwLCBpbm5lcjo1fVxuICAgICAgaGFsZmggPSAoaCttYXJnaW4udG9wK21hcmdpbi5ib3R0b20pXG4gICAgICB0b3RhbGggPSBoYWxmaCoyXG4gICAgICBoYWxmdyA9ICh3K21hcmdpbi5sZWZ0K21hcmdpbi5yaWdodClcbiAgICAgIHRvdGFsdyA9IGhhbGZ3KjJcblxuICAgICAgI21ha2Ugc3VyZSBpdHMgQHNjYXR0ZXJwbG90IHRvIHBhc3MgaW4gdGhlIHJpZ2h0IGNvbnRleHQgKHRhYikgZm9yIGQzXG4gICAgICBteWNoYXJ0ID0gQHNjYXR0ZXJwbG90KCkueHZhcigwKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAueXZhcigxKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAueGxhYihcIkZpc2hpbmcgVmFsdWVcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnlsYWIoXCJFY29sb2dpY2FsIFZhbHVlXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5oZWlnaHQoaClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLndpZHRoKHcpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXJnaW4obWFyZ2luKVxuXG5cbiAgICAgIGNoID0gZDMuc2VsZWN0KEAkKCcudHJhZGVvZmYtY2hhcnQnKSlcbiAgICAgIGNoLmRhdHVtKHRyYWRlb2ZmX2RhdGEpXG4gICAgICAgIC5jYWxsKG15Y2hhcnQpXG5cbiAgICAgIHRvb2x0aXAgPSBkMy5zZWxlY3QoXCJib2R5XCIpXG4gICAgICAgIC5hcHBlbmQoXCJkaXZcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImNoYXJ0LXRvb2x0aXBcIilcbiAgICAgICAgLmF0dHIoXCJpZFwiLCBcImNoYXJ0LXRvb2x0aXBcIilcbiAgICAgICAgLnRleHQoXCJkYXRhXCIpXG5cbiAgICAgIG15Y2hhcnQucG9pbnRzU2VsZWN0KClcbiAgICAgICAgLm9uIFwibW91c2VvdmVyXCIsIChkKSAtPiByZXR1cm4gdG9vbHRpcC5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJ2aXNpYmxlXCIpLmh0bWwoXCI8dWw+PHN0cm9uZz5Qcm9wb3NhbDogXCIrd2luZG93LmFwcC5za2V0Y2hlcy5nZXQoZC5QUk9QT1NBTCkuYXR0cmlidXRlcy5uYW1lK1wiPC9zdHJvbmc+PGxpPiBGaXNoaW5nIHZhbHVlOiBcIitkLkZJU0hfVkFMK1wiPC9saT48bGk+IENvbnNlcnZhdGlvbiB2YWx1ZTogXCIrZC5FQ09fVkFMK1wiPC9saT48L3VsPlwiKVxuXG4gICAgICBteWNoYXJ0LnBvaW50c1NlbGVjdCgpXG4gICAgICAgIC5vbiBcIm1vdXNlbW92ZVwiLCAoZCkgLT4gcmV0dXJuIHRvb2x0aXAuc3R5bGUoXCJ0b3BcIiwgKGV2ZW50LnBhZ2VZLTEwKStcInB4XCIpLnN0eWxlKFwibGVmdFwiLChjYWxjX3R0aXAoZXZlbnQucGFnZVgsIGQsIHRvb2x0aXApKStcInB4XCIpXG5cbiAgICAgIG15Y2hhcnQucG9pbnRzU2VsZWN0KClcbiAgICAgICAgLm9uIFwibW91c2VvdXRcIiwgKGQpIC0+IHJldHVybiB0b29sdGlwLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcImhpZGRlblwiKVxuXG4gICAgICBteWNoYXJ0LmxhYmVsc1NlbGVjdCgpXG4gICAgICAgIC5vbiBcIm1vdXNlb3ZlclwiLCAoZCkgLT4gcmV0dXJuIHRvb2x0aXAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwidmlzaWJsZVwiKS5odG1sKFwiPHVsPjxzdHJvbmc+UHJvcG9zYWw6IFwiK3dpbmRvdy5hcHAuc2tldGNoZXMuZ2V0KGQuUFJPUE9TQUwpLmF0dHJpYnV0ZXMubmFtZStcIjwvc3Ryb25nPjxsaT4gRmlzaGluZyB2YWx1ZTogXCIrZC5GSVNIX1ZBTCtcIjwvbGk+PGxpPiBDb25zZXJ2YXRpb24gdmFsdWU6IFwiK2QuRUNPX1ZBTCtcIjwvbGk+PC91bD5cIilcblxuICAgICAgbXljaGFydC5sYWJlbHNTZWxlY3QoKVxuICAgICAgICAub24gXCJtb3VzZW1vdmVcIiwgKGQpIC0+IHJldHVybiB0b29sdGlwLnN0eWxlKFwidG9wXCIsIChldmVudC5wYWdlWS0xMCkrXCJweFwiKS5zdHlsZShcImxlZnRcIiwoY2FsY190dGlwKGV2ZW50LnBhZ2VYLCBkLCB0b29sdGlwKSkrXCJweFwiKVxuXG4gICAgICBteWNoYXJ0LmxhYmVsc1NlbGVjdCgpXG4gICAgICAgIC5vbiBcIm1vdXNlb3V0XCIsIChkKSAtPiByZXR1cm4gdG9vbHRpcC5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJoaWRkZW5cIilcblxuICBjYWxjX3R0aXAgPSAoeGxvYywgZGF0YSwgdG9vbHRpcCkgLT5cbiAgICB0ZGl2ID0gdG9vbHRpcFswXVswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgIHRsZWZ0ID0gdGRpdi5sZWZ0XG4gICAgdHcgPSB0ZGl2LndpZHRoXG4gICAgcmV0dXJuIHhsb2MtKHR3KzEwKSBpZiAoeGxvYyt0dyA+IHRsZWZ0K3R3KVxuICAgIHJldHVybiB4bG9jKzEwXG5cblxuICBzY2F0dGVycGxvdDogKCkgPT5cbiAgICB2aWV3ID0gQFxuICAgIHdpZHRoID0gMzgwXG4gICAgaGVpZ2h0ID0gNjAwXG4gICAgbWFyZ2luID0ge2xlZnQ6NDAsIHRvcDo1LCByaWdodDo0MCwgYm90dG9tOiA0MCwgaW5uZXI6NX1cbiAgICBheGlzcG9zID0ge3h0aXRsZToyNSwgeXRpdGxlOjMwLCB4bGFiZWw6NSwgeWxhYmVsOjV9XG4gICAgeGxpbSA9IG51bGxcbiAgICB5bGltID0gbnVsbFxuICAgIG54dGlja3MgPSA1XG4gICAgeHRpY2tzID0gbnVsbFxuICAgIG55dGlja3MgPSA1XG4gICAgeXRpY2tzID0gbnVsbFxuICAgICNyZWN0Y29sb3IgPSBkMy5yZ2IoMjMwLCAyMzAsIDIzMClcbiAgICByZWN0Y29sb3IgPSBcIiNkYmU0ZWVcIlxuICAgIHBvaW50c2l6ZSA9IDUgIyBkZWZhdWx0ID0gbm8gdmlzaWJsZSBwb2ludHMgYXQgbWFya2Vyc1xuICAgIHhsYWIgPSBcIlhcIlxuICAgIHlsYWIgPSBcIlkgc2NvcmVcIlxuICAgIHlzY2FsZSA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgeHNjYWxlID0gZDMuc2NhbGUubGluZWFyKClcbiAgICBsZWdlbmRoZWlnaHQgPSAzMDBcbiAgICBwb2ludHNTZWxlY3QgPSBudWxsXG4gICAgbGFiZWxzU2VsZWN0ID0gbnVsbFxuICAgIGxlZ2VuZFNlbGVjdCA9IG51bGxcbiAgICBpZiB3aW5kb3cuZDNcbiAgICAgICNjbGVhciBvdXQgdGhlIG9sZCB2YWx1ZXNcbiAgICAgIHZpZXcuJCgnLnRyYWRlb2ZmLWNoYXJ0JykuaHRtbCgnJylcbiAgICAgIGVsID0gdmlldy4kKCcudHJhZGVvZmYtY2hhcnQnKVswXVxuXG4gICAgIyMgdGhlIG1haW4gZnVuY3Rpb25cbiAgICBjaGFydCA9IChzZWxlY3Rpb24pIC0+XG4gICAgICBzZWxlY3Rpb24uZWFjaCAoZGF0YSkgLT5cbiAgICAgICAgeCA9IGRhdGEubWFwIChkKSAtPiBwYXJzZUZsb2F0KGQuRklTSF9WQUwpXG4gICAgICAgIHkgPSBkYXRhLm1hcCAoZCkgLT4gcGFyc2VGbG9hdChkLkVDT19WQUwpXG5cblxuICAgICAgICBwYW5lbG9mZnNldCA9IDBcbiAgICAgICAgcGFuZWx3aWR0aCA9IHdpZHRoXG5cbiAgICAgICAgcGFuZWxoZWlnaHQgPSBoZWlnaHRcblxuICAgICAgICB4bGltID0gW2QzLm1pbih4KS0yLCBwYXJzZUZsb2F0KGQzLm1heCh4KSsyKV0gaWYgISh4bGltPylcblxuICAgICAgICB5bGltID0gW2QzLm1pbih5KS0yLCBwYXJzZUZsb2F0KGQzLm1heCh5KSsyKV0gaWYgISh5bGltPylcblxuICAgICAgICAjIEknbGwgcmVwbGFjZSBtaXNzaW5nIHZhbHVlcyBzb21ldGhpbmcgc21hbGxlciB0aGFuIHdoYXQncyBvYnNlcnZlZFxuICAgICAgICBuYV92YWx1ZSA9IGQzLm1pbih4LmNvbmNhdCB5KSAtIDEwMFxuICAgICAgICBjdXJyZWxlbSA9IGQzLnNlbGVjdCh2aWV3LiQoJy50cmFkZW9mZi1jaGFydCcpWzBdKVxuICAgICAgICBzdmcgPSBkMy5zZWxlY3Qodmlldy4kKCcudHJhZGVvZmYtY2hhcnQnKVswXSkuYXBwZW5kKFwic3ZnXCIpLmRhdGEoW2RhdGFdKVxuICAgICAgICBzdmcuYXBwZW5kKFwiZ1wiKVxuXG4gICAgICAgICMgVXBkYXRlIHRoZSBvdXRlciBkaW1lbnNpb25zLlxuICAgICAgICBzdmcuYXR0cihcIndpZHRoXCIsIHdpZHRoK21hcmdpbi5sZWZ0K21hcmdpbi5yaWdodClcbiAgICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0K21hcmdpbi50b3ArbWFyZ2luLmJvdHRvbStkYXRhLmxlbmd0aCozNSlcblxuICAgICAgICBnID0gc3ZnLnNlbGVjdChcImdcIilcblxuICAgICAgICAjIGJveFxuICAgICAgICBnLmFwcGVuZChcInJlY3RcIilcbiAgICAgICAgIC5hdHRyKFwieFwiLCBwYW5lbG9mZnNldCttYXJnaW4ubGVmdClcbiAgICAgICAgIC5hdHRyKFwieVwiLCBtYXJnaW4udG9wKVxuICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgcGFuZWxoZWlnaHQpXG4gICAgICAgICAuYXR0cihcIndpZHRoXCIsIHBhbmVsd2lkdGgpXG4gICAgICAgICAuYXR0cihcImZpbGxcIiwgcmVjdGNvbG9yKVxuICAgICAgICAgLmF0dHIoXCJzdHJva2VcIiwgXCJub25lXCIpXG5cblxuICAgICAgICAjIHNpbXBsZSBzY2FsZXMgKGlnbm9yZSBOQSBidXNpbmVzcylcbiAgICAgICAgeHJhbmdlID0gW21hcmdpbi5sZWZ0K3BhbmVsb2Zmc2V0K21hcmdpbi5pbm5lciwgbWFyZ2luLmxlZnQrcGFuZWxvZmZzZXQrcGFuZWx3aWR0aC1tYXJnaW4uaW5uZXJdXG4gICAgICAgIHlyYW5nZSA9IFttYXJnaW4udG9wK3BhbmVsaGVpZ2h0LW1hcmdpbi5pbm5lciwgbWFyZ2luLnRvcCttYXJnaW4uaW5uZXJdXG4gICAgICAgIHhzY2FsZS5kb21haW4oeGxpbSkucmFuZ2UoeHJhbmdlKVxuICAgICAgICB5c2NhbGUuZG9tYWluKHlsaW0pLnJhbmdlKHlyYW5nZSlcbiAgICAgICAgeHMgPSBkMy5zY2FsZS5saW5lYXIoKS5kb21haW4oeGxpbSkucmFuZ2UoeHJhbmdlKVxuICAgICAgICB5cyA9IGQzLnNjYWxlLmxpbmVhcigpLmRvbWFpbih5bGltKS5yYW5nZSh5cmFuZ2UpXG5cblxuICAgICAgICAjIGlmIHl0aWNrcyBub3QgcHJvdmlkZWQsIHVzZSBueXRpY2tzIHRvIGNob29zZSBwcmV0dHkgb25lc1xuICAgICAgICB5dGlja3MgPSB5cy50aWNrcyhueXRpY2tzKSBpZiAhKHl0aWNrcz8pXG4gICAgICAgIHh0aWNrcyA9IHhzLnRpY2tzKG54dGlja3MpIGlmICEoeHRpY2tzPylcblxuICAgICAgICAjIHgtYXhpc1xuICAgICAgICB4YXhpcyA9IGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJ4IGF4aXNcIilcbiAgICAgICAgeGF4aXMuc2VsZWN0QWxsKFwiZW1wdHlcIilcbiAgICAgICAgICAgICAuZGF0YSh4dGlja3MpXG4gICAgICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAgICAuYXBwZW5kKFwibGluZVwiKVxuICAgICAgICAgICAgIC5hdHRyKFwieDFcIiwgKGQpIC0+IHhzY2FsZShkKSlcbiAgICAgICAgICAgICAuYXR0cihcIngyXCIsIChkKSAtPiB4c2NhbGUoZCkpXG4gICAgICAgICAgICAgLmF0dHIoXCJ5MVwiLCBtYXJnaW4udG9wKVxuICAgICAgICAgICAgIC5hdHRyKFwieTJcIiwgbWFyZ2luLnRvcCtoZWlnaHQpXG4gICAgICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIFwibm9uZVwiKVxuICAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIFwid2hpdGVcIilcbiAgICAgICAgICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCAxKVxuICAgICAgICAgICAgIC5zdHlsZShcInBvaW50ZXItZXZlbnRzXCIsIFwibm9uZVwiKVxuICAgICAgICB4YXhpcy5zZWxlY3RBbGwoXCJlbXB0eVwiKVxuICAgICAgICAgICAgIC5kYXRhKHh0aWNrcylcbiAgICAgICAgICAgICAuZW50ZXIoKVxuICAgICAgICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIChkKSAtPiB4c2NhbGUoZCkpXG4gICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIG1hcmdpbi50b3AraGVpZ2h0K2F4aXNwb3MueGxhYmVsKVxuICAgICAgICAgICAgIC50ZXh0KChkKSAtPiBmb3JtYXRBeGlzKHh0aWNrcykoZCkpXG4gICAgICAgIHhheGlzLmFwcGVuZChcInRleHRcIikuYXR0cihcImNsYXNzXCIsIFwieGF4aXMtdGl0bGVcIilcbiAgICAgICAgICAgICAuYXR0cihcInhcIiwgbWFyZ2luLmxlZnQrd2lkdGgvMilcbiAgICAgICAgICAgICAuYXR0cihcInlcIiwgbWFyZ2luLnRvcCtoZWlnaHQrYXhpc3Bvcy54dGl0bGUpXG4gICAgICAgICAgICAgLnRleHQoeGxhYilcbiAgICAgICAgeGF4aXMuc2VsZWN0QWxsKFwiZW1wdHlcIilcbiAgICAgICAgICAgICAuZGF0YShkYXRhKVxuICAgICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgICAgLmFwcGVuZChcImNpcmNsZVwiKVxuICAgICAgICAgICAgIC5hdHRyKFwiY3hcIiwgKGQsaSkgLT4gbWFyZ2luLmxlZnQpXG4gICAgICAgICAgICAgLmF0dHIoXCJjeVwiLCAoZCxpKSAtPiBtYXJnaW4udG9wK2hlaWdodCtheGlzcG9zLnh0aXRsZSsoKGkrMSkqMzApKzYpXG4gICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCAoZCxpKSAtPiBcInB0I3tpfVwiKVxuICAgICAgICAgICAgIC5hdHRyKFwiclwiLCBwb2ludHNpemUpXG4gICAgICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIChkLGkpIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZhbCA9IGkgJSAxN1xuICAgICAgICAgICAgICAgICAgICAgICAgICBjb2wgPSBnZXRDb2xvcnModmFsKVxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAuYXR0cihcInN0cm9rZVwiLCAoZCwgaSkgLT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsID0gTWF0aC5mbG9vcihpLzE3KSAlIDVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29sID0gZ2V0U3Ryb2tlQ29sb3IodmFsKVxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCBcIjFcIilcblxuICAgICAgICB4YXhpcy5zZWxlY3RBbGwoXCJlbXB0eVwiKVxuICAgICAgICAgICAgIC5kYXRhKGRhdGEpXG4gICAgICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJsZWdlbmQtdGV4dFwiKVxuXG4gICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIChkLGkpIC0+XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hcmdpbi5sZWZ0KzIwKVxuICAgICAgICAgICAgIC5hdHRyKFwieVwiLCAoZCxpKSAtPlxuICAgICAgICAgICAgICAgIG1hcmdpbi50b3AraGVpZ2h0K2F4aXNwb3MueHRpdGxlKygoaSsxKSozMCkpXG4gICAgICAgICAgICAgLnRleHQoKGQpIC0+IHJldHVybiB3aW5kb3cuYXBwLnNrZXRjaGVzLmdldChkLlBST1BPU0FMKS5hdHRyaWJ1dGVzLm5hbWUpXG4gICAgICAgICMgeS1heGlzXG4gICAgICAgIHlheGlzID0gZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJjbGFzc1wiLCBcInkgYXhpc1wiKVxuICAgICAgICB5YXhpcy5zZWxlY3RBbGwoXCJlbXB0eVwiKVxuICAgICAgICAgICAgIC5kYXRhKHl0aWNrcylcbiAgICAgICAgICAgICAuZW50ZXIoKVxuICAgICAgICAgICAgIC5hcHBlbmQoXCJsaW5lXCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJ5MVwiLCAoZCkgLT4geXNjYWxlKGQpKVxuICAgICAgICAgICAgIC5hdHRyKFwieTJcIiwgKGQpIC0+IHlzY2FsZShkKSlcbiAgICAgICAgICAgICAuYXR0cihcIngxXCIsIG1hcmdpbi5sZWZ0KVxuICAgICAgICAgICAgIC5hdHRyKFwieDJcIiwgbWFyZ2luLmxlZnQrd2lkdGgpXG4gICAgICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIFwibm9uZVwiKVxuICAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIFwid2hpdGVcIilcbiAgICAgICAgICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCAxKVxuICAgICAgICAgICAgIC5zdHlsZShcInBvaW50ZXItZXZlbnRzXCIsIFwibm9uZVwiKVxuICAgICAgICB5YXhpcy5zZWxlY3RBbGwoXCJlbXB0eVwiKVxuICAgICAgICAgICAgIC5kYXRhKHl0aWNrcylcbiAgICAgICAgICAgICAuZW50ZXIoKVxuICAgICAgICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIChkKSAtPiB5c2NhbGUoZCkpXG4gICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIG1hcmdpbi5sZWZ0LWF4aXNwb3MueWxhYmVsKVxuICAgICAgICAgICAgIC50ZXh0KChkKSAtPiBmb3JtYXRBeGlzKHl0aWNrcykoZCkpXG4gICAgICAgIHlheGlzLmFwcGVuZChcInRleHRcIikuYXR0cihcImNsYXNzXCIsIFwidGl0bGVcIilcbiAgICAgICAgICAgICAuYXR0cihcInlcIiwgbWFyZ2luLnRvcCtoZWlnaHQvMilcbiAgICAgICAgICAgICAuYXR0cihcInhcIiwgbWFyZ2luLmxlZnQtYXhpc3Bvcy55dGl0bGUpXG4gICAgICAgICAgICAgLnRleHQoeWxhYilcbiAgICAgICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInJvdGF0ZSgyNzAsI3ttYXJnaW4ubGVmdC1heGlzcG9zLnl0aXRsZX0sI3ttYXJnaW4udG9wK2hlaWdodC8yfSlcIilcblxuXG4gICAgICAgIGxhYmVscyA9IGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiaWRcIiwgXCJsYWJlbHNcIilcbiAgICAgICAgbGFiZWxzU2VsZWN0ID1cbiAgICAgICAgICBsYWJlbHMuc2VsZWN0QWxsKFwiZW1wdHlcIilcbiAgICAgICAgICAgICAgICAuZGF0YShkYXRhKVxuICAgICAgICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgICAgICAgLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgICAgICAgICAudGV4dCgoZCktPiByZXR1cm4gd2luZG93LmFwcC5za2V0Y2hlcy5nZXQoZC5QUk9QT1NBTCkuYXR0cmlidXRlcy5uYW1lKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwieFwiLCAoZCxpKSAtPlxuICAgICAgICAgICAgICAgICAgeHBvcyA9IHhzY2FsZSh4W2ldKVxuICAgICAgICAgICAgICAgICAgc3RyaW5nX2VuZCA9IHhwb3MrdGhpcy5nZXRDb21wdXRlZFRleHRMZW5ndGgoKVxuICAgICAgICAgICAgICAgICAgb3ZlcmxhcF94c3RhcnQgPSB4cG9zLSh0aGlzLmdldENvbXB1dGVkVGV4dExlbmd0aCgpKzUpXG4gICAgICAgICAgICAgICAgICBpZiBvdmVybGFwX3hzdGFydCA8IDUwXG4gICAgICAgICAgICAgICAgICAgIG92ZXJsYXBfeHN0YXJ0ID0gNTBcbiAgICAgICAgICAgICAgICAgIHJldHVybiBvdmVybGFwX3hzdGFydCBpZiBzdHJpbmdfZW5kID4gd2lkdGhcbiAgICAgICAgICAgICAgICAgIHJldHVybiB4cG9zKzVcbiAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAuYXR0cihcInlcIiwgKGQsaSkgLT5cbiAgICAgICAgICAgICAgICAgIHlwb3MgPSB5c2NhbGUoeVtpXSlcbiAgICAgICAgICAgICAgICAgIHJldHVybiB5cG9zKzEwIGlmICh5cG9zIDwgNTApXG4gICAgICAgICAgICAgICAgICByZXR1cm4geXBvcy01XG4gICAgICAgICAgICAgICAgICApXG5cblxuICAgICAgICBwb2ludHMgPSBnLmFwcGVuZChcImdcIikuYXR0cihcImlkXCIsIFwicG9pbnRzXCIpXG4gICAgICAgIHBvaW50c1NlbGVjdCA9XG4gICAgICAgICAgcG9pbnRzLnNlbGVjdEFsbChcImVtcHR5XCIpXG4gICAgICAgICAgICAgICAgLmRhdGEoZGF0YSlcbiAgICAgICAgICAgICAgICAuZW50ZXIoKVxuICAgICAgICAgICAgICAgIC5hcHBlbmQoXCJjaXJjbGVcIilcbiAgICAgICAgICAgICAgICAuYXR0cihcImN4XCIsIChkLGkpIC0+IHhzY2FsZSh4W2ldKSlcbiAgICAgICAgICAgICAgICAuYXR0cihcImN5XCIsIChkLGkpIC0+IHlzY2FsZSh5W2ldKSlcbiAgICAgICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIChkLGkpIC0+IFwicHQje2l9XCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJyXCIsIHBvaW50c2l6ZSlcbiAgICAgICAgICAgICAgICAuYXR0cihcImZpbGxcIiwgKGQsaSkgLT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsID0gaVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb2wgPSBnZXRDb2xvcnMoW3ZhbF0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb2xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIChkLCBpKSAtPlxuICAgICAgICAgICAgICAgICAgICAgICAgICB2YWwgPSBNYXRoLmZsb29yKGkvMTcpICUgNVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb2wgPSBnZXRTdHJva2VDb2xvcih2YWwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb2xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlLXdpZHRoXCIsIFwiMVwiKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwib3BhY2l0eVwiLCAoZCxpKSAtPlxuICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDEgaWYgKHhbaV0/IG9yIHhOQS5oYW5kbGUpIGFuZCAoeVtpXT8gb3IgeU5BLmhhbmRsZSlcbiAgICAgICAgICAgICAgICAgICAgIHJldHVybiAwKVxuXG4gICAgICAgICMgYm94XG4gICAgICAgIGcuYXBwZW5kKFwicmVjdFwiKVxuICAgICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIG1hcmdpbi5sZWZ0K3BhbmVsb2Zmc2V0KVxuICAgICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIG1hcmdpbi50b3ApXG4gICAgICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCBwYW5lbGhlaWdodClcbiAgICAgICAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgcGFuZWx3aWR0aClcbiAgICAgICAgICAgICAgIC5hdHRyKFwiZmlsbFwiLCBcIm5vbmVcIilcbiAgICAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIFwiYmxhY2tcIilcbiAgICAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlLXdpZHRoXCIsIFwibm9uZVwiKVxuXG5cblxuICAgICMjIGNvbmZpZ3VyYXRpb24gcGFyYW1ldGVyc1xuXG5cbiAgICBjaGFydC53aWR0aCA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiB3aWR0aCBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgd2lkdGggPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0LmhlaWdodCA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiBoZWlnaHQgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIGhlaWdodCA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQubWFyZ2luID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIG1hcmdpbiBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgbWFyZ2luID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC5heGlzcG9zID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIGF4aXNwb3MgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIGF4aXNwb3MgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0LnhsaW0gPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4geGxpbSBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgeGxpbSA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQubnh0aWNrcyA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiBueHRpY2tzIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICBueHRpY2tzID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC54dGlja3MgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4geHRpY2tzIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICB4dGlja3MgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0LnlsaW0gPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4geWxpbSBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgeWxpbSA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQubnl0aWNrcyA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiBueXRpY2tzIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICBueXRpY2tzID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC55dGlja3MgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4geXRpY2tzIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICB5dGlja3MgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0LnJlY3Rjb2xvciA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiByZWN0Y29sb3IgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHJlY3Rjb2xvciA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQucG9pbnRjb2xvciA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiBwb2ludGNvbG9yIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICBwb2ludGNvbG9yID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC5wb2ludHNpemUgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4gcG9pbnRzaXplIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICBwb2ludHNpemUgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0LnBvaW50c3Ryb2tlID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHBvaW50c3Ryb2tlIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICBwb2ludHN0cm9rZSA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQueGxhYiA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiB4bGFiIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICB4bGFiID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC55bGFiID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHlsYWIgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHlsYWIgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0Lnh2YXIgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4geHZhciBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgeHZhciA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQueXZhciA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiB5dmFyIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICB5dmFyID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC55c2NhbGUgPSAoKSAtPlxuICAgICAgcmV0dXJuIHlzY2FsZVxuXG4gICAgY2hhcnQueHNjYWxlID0gKCkgLT5cbiAgICAgIHJldHVybiB4c2NhbGVcblxuICAgIGNoYXJ0LnBvaW50c1NlbGVjdCA9ICgpIC0+XG4gICAgICByZXR1cm4gcG9pbnRzU2VsZWN0XG5cbiAgICBjaGFydC5sYWJlbHNTZWxlY3QgPSAoKSAtPlxuICAgICAgcmV0dXJuIGxhYmVsc1NlbGVjdFxuXG4gICAgY2hhcnQubGVnZW5kU2VsZWN0ID0gKCkgLT5cbiAgICAgIHJldHVybiBsZWdlbmRTZWxlY3RcblxuICAgICMgcmV0dXJuIHRoZSBjaGFydCBmdW5jdGlvblxuICAgIGNoYXJ0XG5cbiAgZ2V0Q29sb3JzID0gKGkpIC0+XG4gICAgY29sb3JzID0gW1wiTGlnaHRHcmVlblwiLCBcIkxpZ2h0UGlua1wiLCBcIkxpZ2h0U2t5Qmx1ZVwiLCBcIk1vY2Nhc2luXCIsIFwiQmx1ZVZpb2xldFwiLCBcIkdhaW5zYm9yb1wiLCBcIkRhcmtHcmVlblwiLCBcIkRhcmtUdXJxdW9pc2VcIiwgXCJtYXJvb25cIiwgXCJuYXZ5XCIsIFwiTGVtb25DaGlmZm9uXCIsIFwib3JhbmdlXCIsICBcInJlZFwiLCBcInNpbHZlclwiLCBcInRlYWxcIiwgXCJ3aGl0ZVwiLCBcImJsYWNrXCJdXG4gICAgcmV0dXJuIGNvbG9yc1tpXVxuXG4gIGdldFN0cm9rZUNvbG9yID0gKGkpIC0+XG4gICAgc2NvbG9ycyA9IFtcImJsYWNrXCIsIFwid2hpdGVcIiwgXCJncmF5XCIsIFwiYnJvd25cIiwgXCJOYXZ5XCJdXG4gICAgcmV0dXJuIHNjb2xvcnNbaV1cblxuICAjIGZ1bmN0aW9uIHRvIGRldGVybWluZSByb3VuZGluZyBvZiBheGlzIGxhYmVsc1xuICBmb3JtYXRBeGlzID0gKGQpIC0+XG4gICAgZCA9IGRbMV0gLSBkWzBdXG4gICAgbmRpZyA9IE1hdGguZmxvb3IoIE1hdGgubG9nKGQgJSAxMCkgLyBNYXRoLmxvZygxMCkgKVxuICAgIG5kaWcgPSAwIGlmIG5kaWcgPiAwXG4gICAgbmRpZyA9IE1hdGguYWJzKG5kaWcpXG4gICAgZDMuZm9ybWF0KFwiLiN7bmRpZ31mXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gQXJyYXlUcmFkZW9mZnNUYWJcbiIsIm1vZHVsZS5leHBvcnRzID0gXG4gIFNBTkNUVUFSWV9JRDogJzUzM2RlOTZiYTQ5ODg2N2M1NmM2ZDFjNSdcbiAgQVFVQUNVTFRVUkVfSUQ6ICc1MjBiYjFjMDBiZDIyYzliMjE0N2I5OWInXG4gIE1PT1JJTkdfSUQ6ICc1MzNkZTRlM2E0OTg4NjdjNTZjNmNkNDUnXG4gIE5PX05FVF9aT05FU19JRDogJzUzM2RlNjIwYTQ5ODg2N2M1NmM2Y2ZjMidcbiAgU0hJUFBJTkdfWk9ORV9JRDogJzUzM2RlY2E3YTQ5ODg2N2M1NmM2ZDU1ZidcbiIsInRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5BcnJheU92ZXJ2aWV3VGFiID0gcmVxdWlyZSAnLi9hcnJheU92ZXJ2aWV3VGFiLmNvZmZlZSdcbkFycmF5SGFiaXRhdFRhYiA9IHJlcXVpcmUgJy4vYXJyYXlIYWJpdGF0VGFiLmNvZmZlZSdcbkFycmF5RmlzaGluZ1ZhbHVlVGFiID0gcmVxdWlyZSAnLi9hcnJheUZpc2hpbmdWYWx1ZVRhYi5jb2ZmZWUnXG5BcnJheVRyYWRlb2Zmc1RhYiA9IHJlcXVpcmUgJy4vYXJyYXlUcmFkZW9mZnMuY29mZmVlJ1xuI092ZXJ2aWV3VGFiID0gcmVxdWlyZSAnLi9vdmVydmlld1RhYi5jb2ZmZWUnXG53aW5kb3cuYXBwLnJlZ2lzdGVyUmVwb3J0IChyZXBvcnQpIC0+XG4gIHJlcG9ydC50YWJzIFtBcnJheU92ZXJ2aWV3VGFiLCBBcnJheUhhYml0YXRUYWIsIEFycmF5RmlzaGluZ1ZhbHVlVGFiLCBBcnJheVRyYWRlb2Zmc1RhYl1cbiAgI3JlcG9ydC50YWJzIFtPdmVydmlld1RhYl1cbiAgIyBwYXRoIG11c3QgYmUgcmVsYXRpdmUgdG8gZGlzdC9cbiAgcmVwb3J0LnN0eWxlc2hlZXRzIFsnLi9wcm9wb3NhbC5jc3MnXVxuXG4gICIsInRoaXNbXCJUZW1wbGF0ZXNcIl0gPSB0aGlzW1wiVGVtcGxhdGVzXCJdIHx8IHt9O1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcImFxdWFjdWx0dXJlRmlzaGluZ1ZhbHVlXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkZpc2hpbmcgVmFsdWU8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhpcyBhcXVhY3VsdHVyZSBhcmVhIGRpc3BsYWNlcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBvZiB0aGUgZmlzaGluZyB2YWx1ZSB3aXRoaW4gQmFyYnVkYeKAmXMgd2F0ZXJzLCBiYXNlZCBvbiB1c2VyIHJlcG9ydGVkXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIHZhbHVlcyBvZiBmaXNoaW5nIGdyb3VuZHMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MzNmMTZmNmE0OTg4NjdjNTZjNmZiNTdcXFwiPnNob3cgZmlzaGluZyB2YWx1ZXMgbGF5ZXI8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJhcnJheUZpc2hpbmdWYWx1ZVwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5EaXNwbGFjZWQgRmlzaGluZyBWYWx1ZTwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhhc1NhbmN0dWFyaWVzXCIsYyxwLDEpLGMscCwwLDg2LDQ2MSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIFRoaXMgcHJvcG9zYWwgaW5jbHVkZXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJudW1TYW5jdHVhcmllc1wiLGMscCwwKSkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgXCIpO2lmKF8ucyhfLmYoXCJzYW5jUGx1cmFsXCIsYyxwLDEpLGMscCwwLDIwMiwyMTMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIlNhbmN0dWFyaWVzXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwic2FuY1BsdXJhbFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIlNhbmN0dWFyeVwiKTt9O18uYihcIjwvc3Ryb25nPixcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICBkaXNwbGFjaW5nIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwic2FuY3R1YXJ5UGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgZmlzaGluZyB2YWx1ZSB3aXRoaW4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgQmFyYnVkYSdzIHdhdGVycyBiYXNlZCBvbiB1c2VyIHJlcG9ydGVkIHZhbHVlcyBvZiBmaXNoaW5nIGdyb3VuZHMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3A+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZihfLnMoXy5mKFwiaGFzTm9OZXRab25lc1wiLGMscCwxKSxjLHAsMCw1MDMsOTA1LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgVGhpcyBwcm9wb3NhbCBpbmNsdWRlcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm51bU5vTmV0Wm9uZXNcIixjLHAsMCkpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIFwiKTtpZihfLnMoXy5mKFwibm9OZXRab25lc1BsdXJhbFwiLGMscCwxKSxjLHAsMCw2MjQsNjM2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJOby1OZXQgWm9uZXNcIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJub05ldFpvbmVzUGx1cmFsXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiTm8tTmV0IFpvbmVcIik7fTtfLmIoXCI8L3N0cm9uZz4sXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgZGlzcGxhY2luZyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm5vTmV0Wm9uZXNQZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiBmaXNoaW5nIHZhbHVlIHdpdGhpbiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICBCYXJidWRhJ3Mgd2F0ZXJzIGJhc2VkIG9uIHVzZXIgcmVwb3J0ZWQgdmFsdWVzIG9mIGZpc2hpbmcgZ3JvdW5kcy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKF8ucyhfLmYoXCJoYXNNb29yaW5nc1wiLGMscCwxKSxjLHAsMCw5NDQsMTMyMCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIFRoaXMgcHJvcG9zYWwgaW5jbHVkZXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJudW1Nb29yaW5nc1wiLGMscCwwKSkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgTW9vcmluZyBhbmQgQW5jaG9yYWdlIFpvbmVcIik7aWYoXy5zKF8uZihcIm1vb3JpbmdzUGx1cmFsXCIsYyxwLDEpLGMscCwwLDEwODcsMTA4OCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic1wiKTt9KTtjLnBvcCgpO31fLmIoXCI8L3N0cm9uZz4sXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgd2hpY2ggbWF5IHBvdGVudGlhbGx5IGRpc3BsYWNlIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibW9vcmluZ3NQZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiBmaXNoaW5nIHZhbHVlIHdpdGhpbiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICBCYXJidWRhJ3Mgd2F0ZXJzIGJhc2VkIG9uIHVzZXIgcmVwb3J0ZWQgdmFsdWVzIG9mIGZpc2hpbmcgZ3JvdW5kcy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKF8ucyhfLmYoXCJoYXNTaGlwcGluZ1pvbmVzXCIsYyxwLDEpLGMscCwwLDEzNjIsMTc0NSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIFRoaXMgcHJvcG9zYWwgaW5jbHVkZXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJudW1TaGlwcGluZ1pvbmVzXCIsYyxwLDApKSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICBTaGlwcGluZyBab25lXCIpO2lmKF8ucyhfLmYoXCJzaGlwcGluZ1pvbmVzUGx1cmFsXCIsYyxwLDEpLGMscCwwLDE1MDIsMTUwMyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic1wiKTt9KTtjLnBvcCgpO31fLmIoXCI8L3N0cm9uZz4sXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgd2hpY2ggbWF5IHBvdGVudGlhbGx5IGRpc3BsYWNlIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwic2hpcHBpbmdab25lc1BlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIGZpc2hpbmcgdmFsdWUgd2l0aGluIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIEJhcmJ1ZGEncyB3YXRlcnMgYmFzZWQgb24gdXNlciByZXBvcnRlZCB2YWx1ZXMgb2YgZmlzaGluZyBncm91bmRzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MzNmMTZmNmE0OTg4NjdjNTZjNmZiNTdcXFwiPnNob3cgZmlzaGluZyB2YWx1ZXMgbGF5ZXI8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJhcnJheUhhYml0YXRzXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO2lmKF8ucyhfLmYoXCJzYW5jdHVhcmllc1wiLGMscCwxKSxjLHAsMCwxNiw5MTksXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkhhYml0YXRzIHdpdGhpbiBcIik7Xy5iKF8udihfLmYoXCJudW1TYW5jdHVhcmllc1wiLGMscCwwKSkpO18uYihcIiBcIik7aWYoIV8ucyhfLmYoXCJzYW5jdHVhcnlQbHVyYWxcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJTYW5jdHVhcnlcIik7fTtpZihfLnMoXy5mKFwic2FuY3R1YXJ5UGx1cmFsXCIsYyxwLDEpLGMscCwwLDE3MCwxODEsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIlNhbmN0dWFyaWVzXCIpO30pO2MucG9wKCk7fV8uYihcIjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+SGFiaXRhdDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+UGVyY2VudCBvZiBUb3RhbCBIYWJpdGF0PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5NZWV0cyAzMyUgZ29hbDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJzYW5jdHVhcnlIYWJpdGF0XCIsYyxwLDEpLGMscCwwLDQwMyw2MTYsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0ciBjbGFzcz1cXFwiXCIpO2lmKF8ucyhfLmYoXCJtZWV0c0dvYWxcIixjLHAsMSksYyxwLDAsNDM1LDQ0MixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwibWV0R29hbFwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkhhYlR5cGVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIgJTwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO2lmKF8ucyhfLmYoXCJtZWV0c0dvYWxcIixjLHAsMSksYyxwLDAsNTQ1LDU0OCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwieWVzXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwibWVldHNHb2FsXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwibm9cIik7fTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgUGVyY2VudGFnZXMgc2hvd24gcmVwcmVzZW50IHRoZSBwcm9wb3J0aW9uIG9mIGhhYml0YXRzIGF2YWlsYWJsZSBpbiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgQmFyYnVkYSdzIGVudGlyZSAzIG5hdXRpY2FsIG1pbGUgYm91bmRhcnkgY2FwdHVyZWQgd2l0aGluIHNhbmN0dWFyaWVzLiA8YnI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjUzM2RkZjg2YTQ5ODg2N2M1NmM2YzgzMFxcXCI+c2hvdyBoYWJpdGF0cyBsYXllcjwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcIm1vb3JpbmdzXCIsYyxwLDEpLGMscCwwLDk1MCwxNTYxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5IYWJpdGF0cyB3aXRoaW4gXCIpO18uYihfLnYoXy5mKFwibnVtTW9vcmluZ3NcIixjLHAsMCkpKTtfLmIoXCIgTW9vcmluZyBBcmVhXCIpO2lmKF8ucyhfLmYoXCJtb29yaW5nUGx1cmFsXCIsYyxwLDEpLGMscCwwLDEwNjIsMTA2MyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic1wiKTt9KTtjLnBvcCgpO31fLmIoXCI8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkhhYml0YXQ8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPlBlcmNlbnQgb2YgVG90YWwgSGFiaXRhdDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJtb29yaW5nRGF0YVwiLGMscCwxKSxjLHAsMCwxMjQ2LDEzMzYsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJIYWJUeXBlXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJQZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiICU8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPCEtLSAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBQZXJjZW50YWdlcyBzaG93biByZXByZXNlbnQgdGhlIHByb3BvcnRpb24gb2YgaGFiaXRhdHMgYXZhaWxhYmxlIGluIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBCYXJidWRhJ3MgZW50aXJlIDMgbmF1dGljYWwgbWlsZSBib3VuZGFyeSBjYXB0dXJlZCB3aXRoaW4gbW9vcmluZyBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgYXJlYXMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+IC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaGFzTm9OZXRab25lc1wiLGMscCwxKSxjLHAsMCwxNTk0LDIyMTIsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkhhYml0YXRzIHdpdGhpbiBcIik7Xy5iKF8udihfLmYoXCJudW1Ob05ldFpvbmVzXCIsYyxwLDApKSk7Xy5iKFwiIE5vIE5ldCBab25lXCIpO2lmKF8ucyhfLmYoXCJub05ldFpvbmVzUGx1cmFsXCIsYyxwLDEpLGMscCwwLDE3MTAsMTcxMSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic1wiKTt9KTtjLnBvcCgpO31fLmIoXCI8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkhhYml0YXQ8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPlBlcmNlbnQgb2YgVG90YWwgSGFiaXRhdDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJub05ldFpvbmVzRGF0YVwiLGMscCwxKSxjLHAsMCwxOTAwLDE5OTAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJIYWJUeXBlXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJQZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiICU8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8IS0tIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBQZXJjZW50YWdlcyBzaG93biByZXByZXNlbnQgdGhlIHByb3BvcnRpb24gb2YgaGFiaXRhdHMgYXZhaWxhYmxlIGluIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBCYXJidWRhJ3MgZW50aXJlIDMgbmF1dGljYWwgbWlsZSBib3VuZGFyeSBjYXB0dXJlZCB3aXRoaW4gbm8gbmV0IHpvbmVzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPiAtLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0Pk1hcnhhbiBBbmFseXNpcyA8YSBzdHlsZT1cXFwidG9wOjBweDtcXFwiIGNsYXNzPVxcXCJtYXJ4YW4tbm9kZVxcXCIgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTMzZGUyMGFhNDk4ODY3YzU2YzZjYmE1XFxcIj5TaG93ICdTY2VuYXJpbyAxJyBNYXJ4YW4gTGF5ZXI8L2E+Jm5ic3A8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHNlbGVjdCBjbGFzcz1cXFwiY2hvc2VuXFxcIiB3aWR0aD1cXFwiNDAwcHhcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJtYXJ4YW5BbmFseXNlc1wiLGMscCwxKSxjLHAsMCwyNDgyLDI1MzcsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8b3B0aW9uIHZhbHVlPVxcXCJcIik7Xy5iKF8udihfLmQoXCIuXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5TY2VuYXJpbyBcIik7Xy5iKF8udihfLmQoXCIuXCIsYyxwLDApKSk7Xy5iKFwiPC9vcHRpb24+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgIDwvc2VsZWN0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcInNjZW5hcmlvUmVzdWx0c1xcXCI+PC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGRpdiBjbGFzcz1cXFwidml6XFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJzY2VuYXJpb0Rlc2NyaXB0aW9uXFxcIj48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcImFycmF5T3ZlcnZpZXdcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7aWYoXy5zKF8uZChcInNrZXRjaENsYXNzLmRlbGV0ZWRcIixjLHAsMSksYyxwLDAsMjQsMjcwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJhbGVydCBhbGVydC13YXJuXFxcIiBzdHlsZT1cXFwibWFyZ2luLWJvdHRvbToxMHB4O1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBUaGlzIHNrZXRjaCB3YXMgY3JlYXRlZCB1c2luZyB0aGUgXFxcIlwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCJcXFwiIHRlbXBsYXRlLCB3aGljaCBpc1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgbm8gbG9uZ2VyIGF2YWlsYWJsZS4gWW91IHdpbGwgbm90IGJlIGFibGUgdG8gY29weSB0aGlzIHNrZXRjaCBvciBtYWtlIG5ld1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgc2tldGNoZXMgb2YgdGhpcyB0eXBlLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHNpemVcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlNpemU8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJoYXNTa2V0Y2hlc1wiLGMscCwxKSxjLHAsMCwzNjMsODc0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhpcyBjb2xsZWN0aW9uIGlzIGNvbXBvc2VkIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibnVtU2tldGNoZXNcIixjLHAsMCkpKTtfLmIoXCIgem9uZVwiKTtpZihfLnMoXy5mKFwic2tldGNoZXNQbHVyYWxcIixjLHAsMSksYyxwLDAsNDY4LDQ2OSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic1wiKTt9KTtjLnBvcCgpO31fLmIoXCI8L3N0cm9uZz4gaW4gYm90aCBvY2VhbiBhbmQgbGFnb29uIHdhdGVycy4gVGhlIGNvbGxlY3Rpb24gaW5jbHVkZXMgYSB0b3RhbCA8ZW0+b2NlYW5pYzwvZW0+IGFyZWEgb2YgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJzdW1PY2VhbkFyZWFcIixjLHAsMCkpKTtfLmIoXCIgc3F1YXJlIG1pbGVzPC9zdHJvbmc+LCB3aGljaCByZXByZXNlbnRzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwic3VtT2NlYW5QZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiBCYXJidWRhJ3Mgd2F0ZXJzLiBJdCBhbHNvIGluY29ycG9yYXRlcyBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJzdW1MYWdvb25BcmVhXCIsYyxwLDApKSk7Xy5iKFwiIHNxdWFyZSBtaWxlczwvc3Ryb25nPiwgb3IgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJzdW1MYWdvb25QZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiwgb2YgdGhlIHRvdGFsIDxlbT5sYWdvb24gYXJlYTwvZW0+LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoXy5zKF8uZihcImhhc1NhbmN0dWFyaWVzXCIsYyxwLDEpLGMscCwwLDkxNCwxNjUzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhlIGNvbGxlY3Rpb24gaW5jbHVkZXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJudW1TYW5jdHVhcmllc1wiLGMscCwwKSkpO18uYihcIiBcIik7aWYoIV8ucyhfLmYoXCJzYW5jdHVhcmllc1BsdXJhbFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcInNhbmN0dWFyeVwiKTt9O2lmKF8ucyhfLmYoXCJzYW5jdHVhcmllc1BsdXJhbFwiLGMscCwxKSxjLHAsMCwxMDY3LDEwNzgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInNhbmN0dWFyaWVzXCIpO30pO2MucG9wKCk7fV8uYihcIjwvc3Ryb25nPiBpbiBib3RoIG9jZWFuIGFuZCBsYWdvb24gd2F0ZXJzLiBUaGUgXCIpO2lmKCFfLnMoXy5mKFwic2FuY3R1YXJpZXNQbHVyYWxcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJzYW5jdHVhcnlcIik7fTtpZihfLnMoXy5mKFwic2FuY3R1YXJpZXNQbHVyYWxcIixjLHAsMSksYyxwLDAsMTIyMiwxMjMzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzYW5jdHVhcmllc1wiKTt9KTtjLnBvcCgpO31fLmIoXCIgY29udGFpblwiKTtpZighXy5zKF8uZihcInNhbmN0dWFyaWVzUGx1cmFsXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwic1wiKTt9O18uYihcIiBhIHRvdGFsIDxlbT5vY2VhbmljPC9lbT4gYXJlYSBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInNhbmN0dWFyeU9jZWFuQXJlYVwiLGMscCwwKSkpO18uYihcIiBzcXVhcmUgbWlsZXM8L3N0cm9uZz4sIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICB3aGljaCByZXByZXNlbnRzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwic2FuY3R1YXJ5T2NlYW5QZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiBCYXJidWRhJ3Mgd2F0ZXJzLiBJdCBhbHNvIGluY2x1ZGVzIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInNhbmN0dWFyeUxhZ29vbkFyZWFcIixjLHAsMCkpKTtfLmIoXCIgc3F1YXJlIG1pbGVzPC9zdHJvbmc+LCBvciA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInNhbmN0dWFyeUxhZ29vblBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+LCBvZiB0aGUgdG90YWwgPGVtPmxhZ29vbiBhcmVhPC9lbT4uXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZihfLnMoXy5mKFwiaGFzTm9OZXRab25lc1wiLGMscCwxKSxjLHAsMCwxNjkzLDIzMjksXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGUgY29sbGVjdGlvbiBpbmNsdWRlcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm51bU5vTmV0Wm9uZXNcIixjLHAsMCkpKTtfLmIoXCIgTm8gTmV0IFpvbmVcIik7aWYoXy5zKF8uZihcIm5vTmV0Wm9uZXNQbHVyYWxcIixjLHAsMSksYyxwLDAsMTgwMiwxODAzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzXCIpO30pO2MucG9wKCk7fV8uYihcIjwvc3Ryb25nPiBpbiBib3RoIG9jZWFuIGFuZCBsYWdvb24gd2F0ZXJzLiBUaGUgTm8gTmV0IFpvbmVcIik7aWYoXy5zKF8uZihcIm5vTmV0Wm9uZXNQbHVyYWxcIixjLHAsMSksYyxwLDAsMTkwMywxOTA0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzXCIpO30pO2MucG9wKCk7fV8uYihcIjwvc3Ryb25nPiBjb250YWluXCIpO2lmKCFfLnMoXy5mKFwibm9OZXRab25lc1BsdXJhbFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcInNcIik7fTtfLmIoXCIgYSB0b3RhbCA8ZW0+b2NlYW5pYzwvZW0+IGFyZWEgb2YgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJub05ldFpvbmVzT2NlYW5BcmVhXCIsYyxwLDApKSk7Xy5iKFwiIHNxdWFyZSBtaWxlczwvc3Ryb25nPiwgd2hpY2ggcmVwcmVzZW50cyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm5vTmV0Wm9uZXNPY2VhblBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIEJhcmJ1ZGEncyB3YXRlcnMuIEl0IGFsc28gaW5jbHVkZXMgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibm9OZXRab25lc0xhZ29vbkFyZWFcIixjLHAsMCkpKTtfLmIoXCIgc3F1YXJlIG1pbGVzPC9zdHJvbmc+LCBvciA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm5vTmV0Wm9uZXNMYWdvb25QZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiwgb2YgdGhlIHRvdGFsIDxlbT5sYWdvb24gYXJlYTwvZW0+LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoXy5zKF8uZihcImhhc01vb3JpbmdzXCIsYyxwLDEpLGMscCwwLDIzNjYsMjk3OCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoZSBjb2xsZWN0aW9uIGluY2x1ZGVzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibnVtTW9vcmluZ3NcIixjLHAsMCkpKTtfLmIoXCIgTW9vcmluZyBBcmVhXCIpO2lmKF8ucyhfLmYoXCJtb29yaW5nc1BsdXJhbFwiLGMscCwxKSxjLHAsMCwyNDcyLDI0NzMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9zdHJvbmc+IGluIGJvdGggb2NlYW4gYW5kIGxhZ29vbiB3YXRlcnMuIFRoZSBNb29yaW5nIEFyZWFcIik7aWYoXy5zKF8uZihcIm1vb3JpbmdzUGx1cmFsXCIsYyxwLDEpLGMscCwwLDI1NzAsMjU3MSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic1wiKTt9KTtjLnBvcCgpO31fLmIoXCIgY29udGFpblwiKTtpZighXy5zKF8uZihcIm1vb3JpbmdzUGx1cmFsXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwic1wiKTt9O18uYihcIiBhIHRvdGFsIDxlbT5vY2VhbmljPC9lbT4gYXJlYSBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm1vb3JpbmdzT2NlYW5BcmVhXCIsYyxwLDApKSk7Xy5iKFwiIHNxdWFyZSBtaWxlczwvc3Ryb25nPiwgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIHdoaWNoIHJlcHJlc2VudHMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJtb29yaW5nc09jZWFuUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgQmFyYnVkYSdzIHdhdGVycy4gSXQgYWxzbyBpbmNsdWRlcyBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJtb29yaW5nc0xhZ29vbkFyZWFcIixjLHAsMCkpKTtfLmIoXCIgc3F1YXJlIG1pbGVzPC9zdHJvbmc+LCBvciA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm1vb3JpbmdzTGFnb29uUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4sIG9mIHRoZSB0b3RhbCA8ZW0+bGFnb29uIGFyZWE8L2VtPi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKF8ucyhfLmYoXCJoYXNBcXVhY3VsdHVyZVwiLGMscCwxKSxjLHAsMCwzMDE2LDM2NjQsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGUgY29sbGVjdGlvbiBpbmNsdWRlcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm51bUFxdWFjdWx0dXJlXCIsYyxwLDApKSk7Xy5iKFwiIEFxdWFjdWx0dXJlIEFyZWFcIik7aWYoXy5zKF8uZihcImFxdWFjdWx0dXJlUGx1cmFsXCIsYyxwLDEpLGMscCwwLDMxMzIsMzEzMyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic1wiKTt9KTtjLnBvcCgpO31fLmIoXCI8L3N0cm9uZz4gaW4gYm90aCBvY2VhbiBhbmQgbGFnb29uIHdhdGVycy4gVGhlIEFxdWFjdWx0dXJlIEFyZWFcIik7aWYoXy5zKF8uZihcImFxdWFjdWx0dXJlUGx1cmFsXCIsYyxwLDEpLGMscCwwLDMyNDAsMzI0MSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic1wiKTt9KTtjLnBvcCgpO31fLmIoXCIgY29udGFpblwiKTtpZighXy5zKF8uZihcImFxdWFjdWx0dXJlUGx1cmFsXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwic1wiKTt9O18uYihcIiBhIHRvdGFsIDxlbT5vY2VhbmljPC9lbT4gYXJlYSBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImFxdWFjdWx0dXJlT2NlYW5BcmVhXCIsYyxwLDApKSk7Xy5iKFwiIHNxdWFyZSBtaWxlczwvc3Ryb25nPiwgd2hpY2ggcmVwcmVzZW50cyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImFxdWFjdWx0dXJlT2NlYW5QZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiBCYXJidWRhJ3Mgd2F0ZXJzLiBJdCBhbHNvIGluY2x1ZGVzIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImFxdWFjdWx0dXJlTGFnb29uQXJlYVwiLGMscCwwKSkpO18uYihcIiBzcXVhcmUgbWlsZXM8L3N0cm9uZz4sIG9yIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiYXF1YWN1bHR1cmVMYWdvb25QZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiwgb2YgdGhlIHRvdGFsIDxlbT5sYWdvb24gYXJlYTwvZW0+LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoXy5zKF8uZihcImhhc0Zpc2hpbmdBcmVhc1wiLGMscCwxKSxjLHAsMCwzNzA2LDQzNzUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGUgY29sbGVjdGlvbiBpbmNsdWRlcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm51bUZpc2hpbmdBcmVhc1wiLGMscCwwKSkpO18uYihcIiBGaXNoaW5nIFByaW9yaXR5IEFyZWFcIik7aWYoXy5zKF8uZihcImZpc2hpbmdBcmVhc1BsdXJhbFwiLGMscCwxKSxjLHAsMCwzODI5LDM4MzAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9zdHJvbmc+IGluIGJvdGggb2NlYW4gYW5kIGxhZ29vbiB3YXRlcnMuIFRoZSBGaXNoaW5nIFByaW9yaXR5IEFyZWFcIik7aWYoXy5zKF8uZihcImZpc2hpbmdBcmVhc1BsdXJhbFwiLGMscCwxKSxjLHAsMCwzOTQ0LDM5NDUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiIGNvbnRhaW5cIik7aWYoIV8ucyhfLmYoXCJmaXNoaW5nQXJlYXNQbHVyYWxcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJzXCIpO307Xy5iKFwiIGEgdG90YWwgPGVtPm9jZWFuaWM8L2VtPiBhcmVhIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiZmlzaGluZ0FyZWFzT2NlYW5BcmVhXCIsYyxwLDApKSk7Xy5iKFwiIHNxdWFyZSBtaWxlczwvc3Ryb25nPiwgd2hpY2ggcmVwcmVzZW50cyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImZpc2hpbmdBcmVhc09jZWFuUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgQmFyYnVkYSdzIHdhdGVycy4gSXQgYWxzbyBpbmNsdWRlcyBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJmaXNoaW5nQXJlYXNMYWdvb25BcmVhXCIsYyxwLDApKSk7Xy5iKFwiIHNxdWFyZSBtaWxlczwvc3Ryb25nPiwgb3IgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJmaXNoaW5nQXJlYXNMYWdvb25QZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiwgb2YgdGhlIHRvdGFsIDxlbT5sYWdvb24gYXJlYTwvZW0+LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPCEtLVwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlpvbmVzIGluIHRoaXMgUHJvcG9zYWw8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGRpdiBjbGFzcz1cXFwidG9jQ29udGFpbmVyXFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCItLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiYW55QXR0cmlidXRlc1wiLGMscCwxKSxjLHAsMCw0NTM0LDQ2NTgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCIgQXR0cmlidXRlczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKF8ucnAoXCJhdHRyaWJ1dGVzL2F0dHJpYnV0ZXNUYWJsZVwiLGMscCxcIiAgXCIpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31yZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJhcnJheVRyYWRlb2Zmc1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5UcmFkZW9mZnM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgXHQ8cCBjbGFzcz1cXFwibGFyZ2VcXFwiIHN0eWxlPVxcXCJtYXJnaW4tbGVmdDoxNXB4O1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdFx0PGEgaHJlZiA9IFxcXCJodHRwOi8vbWNjbGludG9jay5tc2kudWNzYi5lZHUvYmxvZy90cmFkZW9mZi1hbmFseXNlcy1pbi1zZWFza2V0Y2hcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5UcmFkZW9mZiBBbmFseXNpczwvYT4gZXhhbWluZXMgdGhlIGltcGFjdCBvZiBsb2JzdGVyIGFuZCBjb25jaCBmaXNoaW5nIG9uIHJlbGF0aXZlIGVjb2xvZ2ljYWwgYW5kIGZpc2hpbmcgdmFsdWVzLiBQcmV2ZW50aW5nIGZpc2hpbmcgaW4gYW4gYXJlYSBnZW5lcmFsbHlcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0XHRpbmNyZWFzZXMgdGhlIGVjb2xvZ2ljYWwgc2NvcmUgYnkgcmVkdWNpbmcgaW1wYWN0cyBhbmQgZGVjcmVhc2VzIGZpc2hpbmcgdmFsdWVzIGJ5IHJlZHVjaW5nIGZpc2hpbmcgdGFrZS4gU3RvcHBpbmcgZmlzaGluZyBpbiBzb21lIGFyZWFzLCBzdWNoIGFzIG51cnNlcnkgZ3JvdW5kcywgY2FuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdFx0aW5jcmVhc2UgYm90aCBzY29yZXMgYnkgcmVkdWNpbmcgZWNvbG9naWNhbCBpbXBhY3RzIGFuZCBpbmNyZWFzaW5nIGZpc2ggc3RvY2tzLiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0PC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0PHAgY2xhc3M9XFxcInNtYWxsIHR0aXAtdGlwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdCAgIFRpcDogaG92ZXIgb3ZlciBhIHByb3Bvc2FsIHRvIHNlZSBkZXRhaWxzXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQ8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdDxkaXYgIGlkPVxcXCJ0cmFkZW9mZi1jaGFydFxcXCIgY2xhc3M9XFxcInRyYWRlb2ZmLWNoYXJ0XFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiZGVtb1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5SZXBvcnQgU2VjdGlvbnM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+VXNlIHJlcG9ydCBzZWN0aW9ucyB0byBncm91cCBpbmZvcm1hdGlvbiBpbnRvIG1lYW5pbmdmdWwgY2F0ZWdvcmllczwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkQzIFZpc3VhbGl6YXRpb25zPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx1bCBjbGFzcz1cXFwibmF2IG5hdi1waWxsc1xcXCIgaWQ9XFxcInRhYnMyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGxpIGNsYXNzPVxcXCJhY3RpdmVcXFwiPjxhIGhyZWY9XFxcIiNjaGFydFxcXCI+Q2hhcnQ8L2E+PC9saT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGxpPjxhIGhyZWY9XFxcIiNkYXRhVGFibGVcXFwiPlRhYmxlPC9hPjwvbGk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3VsPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGRpdiBjbGFzcz1cXFwidGFiLWNvbnRlbnRcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJ0YWItcGFuZSBhY3RpdmVcXFwiIGlkPVxcXCJjaGFydFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPCEtLVtpZiBJRSA4XT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8cCBjbGFzcz1cXFwidW5zdXBwb3J0ZWRcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIFRoaXMgdmlzdWFsaXphdGlvbiBpcyBub3QgY29tcGF0aWJsZSB3aXRoIEludGVybmV0IEV4cGxvcmVyIDguIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIFBsZWFzZSB1cGdyYWRlIHlvdXIgYnJvd3Nlciwgb3IgdmlldyByZXN1bHRzIGluIHRoZSB0YWJsZSB0YWIuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9wPiAgICAgIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwhW2VuZGlmXS0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgU2VlIDxjb2RlPnNyYy9zY3JpcHRzL2RlbW8uY29mZmVlPC9jb2RlPiBmb3IgYW4gZXhhbXBsZSBvZiBob3cgdG8gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICB1c2UgZDMuanMgdG8gcmVuZGVyIHZpc3VhbGl6YXRpb25zLiBQcm92aWRlIGEgdGFibGUtYmFzZWQgdmlld1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgYW5kIHVzZSBjb25kaXRpb25hbCBjb21tZW50cyB0byBwcm92aWRlIGEgZmFsbGJhY2sgZm9yIElFOCB1c2Vycy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxicj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxhIGhyZWY9XFxcImh0dHA6Ly90d2l0dGVyLmdpdGh1Yi5pby9ib290c3RyYXAvMi4zLjIvXFxcIj5Cb290c3RyYXAgMi54PC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgaXMgbG9hZGVkIHdpdGhpbiBTZWFTa2V0Y2ggc28geW91IGNhbiB1c2UgaXQgdG8gY3JlYXRlIHRhYnMgYW5kIG90aGVyIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgaW50ZXJmYWNlIGNvbXBvbmVudHMuIGpRdWVyeSBhbmQgdW5kZXJzY29yZSBhcmUgYWxzbyBhdmFpbGFibGUuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwidGFiLXBhbmVcXFwiIGlkPVxcXCJkYXRhVGFibGVcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5pbmRleDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPnZhbHVlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImNoYXJ0RGF0YVwiLGMscCwxKSxjLHAsMCwxMzUxLDE0MTgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICA8dHI+PHRkPlwiKTtfLmIoXy52KF8uZihcImluZGV4XCIsYyxwLDApKSk7Xy5iKFwiPC90ZD48dGQ+XCIpO18uYihfLnYoXy5mKFwidmFsdWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPjwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gZW1waGFzaXNcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkVtcGhhc2lzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPkdpdmUgcmVwb3J0IHNlY3Rpb25zIGFuIDxjb2RlPmVtcGhhc2lzPC9jb2RlPiBjbGFzcyB0byBoaWdobGlnaHQgaW1wb3J0YW50IGluZm9ybWF0aW9uLjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gd2FybmluZ1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+V2FybmluZzwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5PciA8Y29kZT53YXJuPC9jb2RlPiBvZiBwb3RlbnRpYWwgcHJvYmxlbXMuPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiBkYW5nZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkRhbmdlcjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD48Y29kZT5kYW5nZXI8L2NvZGU+IGNhbiBhbHNvIGJlIHVzZWQuLi4gc3BhcmluZ2x5LjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiZmlzaGluZ1ByaW9yaXR5QXJlYVwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5GaXNoaW5nIFZhbHVlPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoaXMgZmlzaGluZyBwcmlvcml0eSBhcmVhIGluY2x1ZGVzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwicGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgdGhlIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBmaXNoaW5nIHZhbHVlIHdpdGhpbiBCYXJidWRhJ3Mgd2F0ZXJzLCBiYXNlZCBvbiB1c2VyIHJlcG9ydGVkIHZhbHVlcyBvZiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgZmlzaGluZyBncm91bmRzXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MzNmMTZmNmE0OTg4NjdjNTZjNmZiNTdcXFwiPnNob3cgZmlzaGluZyB2YWx1ZXMgbGF5ZXI8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJmaXNoaW5nVmFsdWVcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RmlzaGluZyBWYWx1ZTwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGlzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiYXJlYUxhYmVsXCIsYyxwLDApKSk7Xy5iKFwiPC9zdHJvbmc+IFwiKTtpZihfLnMoXy5mKFwiaXNNb29yaW5nT3JTaGlwcGluZ1wiLGMscCwxKSxjLHAsMCwxMzcsMTYxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJtYXkgcG90ZW50aWFsbHkgZGlzcGxhY2VcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiIFwiKTtpZighXy5zKF8uZihcImlzTW9vcmluZ09yU2hpcHBpbmdcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJkaXNwbGFjZXNcIik7fTtfLmIoXCIgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwicGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgdGhlIGZpc2hpbmcgdmFsdWUgd2l0aGluIEJhcmJ1ZGHigJlzIHdhdGVycywgYmFzZWQgb24gdXNlciByZXBvcnRlZFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICB2YWx1ZXMgb2YgZmlzaGluZyBncm91bmRzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTMzZjE2ZjZhNDk4ODY3YzU2YzZmYjU3XFxcIj5zaG93IGZpc2hpbmcgdmFsdWVzIGxheWVyPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiaGFiaXRhdFwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5cIik7Xy5iKF8udihfLmYoXCJoZWFkaW5nXCIsYyxwLDApKSk7Xy5iKFwiIDxhIGhyZWY9XFxcIiNcXFwiIHN0eWxlPVxcXCJ0b3A6MHB4O1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTMzZGRmODZhNDk4ODY3YzU2YzZjODMwXFxcIj5zaG93IGhhYml0YXRzIGxheWVyPC9hPjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+SGFiaXRhdDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+JSBvZiBUb3RhbCBIYWJpdGF0PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhhYml0YXRzXCIsYyxwLDEpLGMscCwwLDMxMywzNzYsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0cj48dGQ+XCIpO18uYihfLnYoXy5mKFwiSGFiVHlwZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+PHRkPlwiKTtfLmIoXy52KF8uZihcIlBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCI8L3RkPjwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgUGVyY2VudGFnZXMgc2hvd24gcmVwcmVzZW50IHRoZSBwcm9wb3J0aW9uIG9mIGhhYml0YXRzIGF2YWlsYWJsZSBpbiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgQmFyYnVkYSdzIGVudGlyZSAzIG5hdXRpY2FsIG1pbGUgYm91bmRhcnkgY2FwdHVyZWQgd2l0aGluIHRoaXMgem9uZS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5NYXJ4YW4gQW5hbHlzaXMgPGEgc3R5bGU9XFxcInRvcDowcHg7XFxcIiBjbGFzcz1cXFwibWFyeGFuLW5vZGVcXFwiIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjUzM2RlMjBhYTQ5ODg2N2M1NmM2Y2JhNVxcXCI+U2hvdyAnU2NlbmFyaW8gMScgTWFyeGFuIExheWVyPC9hPiZuYnNwPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxzZWxlY3QgY2xhc3M9XFxcImNob3NlblxcXCIgd2lkdGg9XFxcIjM4MHB4XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwibWFyeGFuQW5hbHlzZXNcIixjLHAsMSksYyxwLDAsODMxLDg4NixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIDxvcHRpb24gdmFsdWU9XFxcIlwiKTtfLmIoXy52KF8uZChcIi5cIixjLHAsMCkpKTtfLmIoXCJcXFwiPlNjZW5hcmlvIFwiKTtfLmIoXy52KF8uZChcIi5cIixjLHAsMCkpKTtfLmIoXCI8L29wdGlvbj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgPC9zZWxlY3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwic2NlbmFyaW9SZXN1bHRzXFxcIj48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJ2aXpcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcInNjZW5hcmlvRGVzY3JpcHRpb25cXFwiPjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm92ZXJ2aWV3XCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO2lmKF8ucyhfLmQoXCJza2V0Y2hDbGFzcy5kZWxldGVkXCIsYyxwLDEpLGMscCwwLDI0LDI3MCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwiYWxlcnQgYWxlcnQtd2FyblxcXCIgc3R5bGU9XFxcIm1hcmdpbi1ib3R0b206MTBweDtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgVGhpcyBza2V0Y2ggd2FzIGNyZWF0ZWQgdXNpbmcgdGhlIFxcXCJcIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiB0ZW1wbGF0ZSwgd2hpY2ggaXNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIG5vIGxvbmdlciBhdmFpbGFibGUuIFlvdSB3aWxsIG5vdCBiZSBhYmxlIHRvIGNvcHkgdGhpcyBza2V0Y2ggb3IgbWFrZSBuZXdcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIHNrZXRjaGVzIG9mIHRoaXMgdHlwZS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiBzaXplXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5TaXplPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoaXMgYXJlYSBpcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIlNRX01JTEVTXCIsYyxwLDApKSk7Xy5iKFwiIHNxdWFyZSBtaWxlczwvc3Ryb25nPixcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgd2hpY2ggcmVwcmVzZW50cyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIlBFUkNFTlRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIEJhcmJ1ZGEncyB3YXRlcnMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwicmVuZGVyTWluaW11bVdpZHRoXCIsYyxwLDEpLGMscCwwLDUzNiwxMTc4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIGRpYW1ldGVyIFwiKTtpZighXy5zKF8uZihcIkRJQU1fT0tcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJ3YXJuaW5nXCIpO307Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5NaW5pbXVtIFdpZHRoPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoZSBtaW5pbXVtIHdpZHRoIG9mIGEgem9uZSBzaWduaWZpY2FudGx5IGltcGFjdHMgIGl0cyBjb25zZXJ2YXRpb24gdmFsdWUuIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGUgcmVjb21tZW5kZWQgc21hbGxlc3QgZGlhbWV0ZXIgaXMgYmV0d2VlbiAyIGFuZCAzIG1pbGVzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8c3Ryb25nPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKCFfLnMoXy5mKFwiRElBTV9PS1wiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgICBUaGlzIGRlc2lnbiBmYWxscyBvdXRzaWRlIHRoZSByZWNvbW1lbmRhdGlvbiBhdCBcIik7Xy5iKF8udihfLmYoXCJESUFNXCIsYyxwLDApKSk7Xy5iKFwiIG1pbGVzLlwiKTtfLmIoXCJcXG5cIik7fTtpZihfLnMoXy5mKFwiRElBTV9PS1wiLGMscCwxKSxjLHAsMCw5MjYsOTk3LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgVGhpcyBkZXNpZ24gZml0cyB3aXRoaW4gdGhlIHJlY29tbWVuZGF0aW9uIGF0IFwiKTtfLmIoXy52KF8uZihcIkRJQU1cIixjLHAsMCkpKTtfLmIoXCIgbWlsZXMuXCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC9zdHJvbmc+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJ2aXpcXFwiIHN0eWxlPVxcXCJwb3NpdGlvbjpyZWxhdGl2ZTtcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGltZyBzcmM9XFxcImh0dHA6Ly9zMy5hbWF6b25hd3MuY29tL1NlYVNrZXRjaC9wcm9qZWN0cy9iYXJidWRhL21pbl93aWR0aF9leGFtcGxlLnBuZ1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJhbnlBdHRyaWJ1dGVzXCIsYyxwLDEpLGMscCwwLDEyMjEsMTM0NSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+XCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIiBBdHRyaWJ1dGVzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXy5ycChcImF0dHJpYnV0ZXMvYXR0cmlidXRlc1RhYmxlXCIsYyxwLFwiICBcIikpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fXJldHVybiBfLmZsKCk7O30pO1xuXG5pZih0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gdGhpc1tcIlRlbXBsYXRlc1wiXTtcbn0iXX0=
