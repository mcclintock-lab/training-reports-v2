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

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = this["Templates"];
}
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
    var aquacultureAreas, aquaculturePercent, context, fishingAreaPercent, fishingAreas, mooringPercent, moorings, noNetZones, noNetZonesPercent, sanctuaries, sanctuaryPercent;
    sanctuaries = this.getChildren(SANCTUARY_ID);
    if (sanctuaries.length) {
      sanctuaryPercent = this.recordSet('FishingValue', 'FishingValue', SANCTUARY_ID).float('PERCENT', 0);
    }
    aquacultureAreas = this.getChildren(AQUACULTURE_ID);
    if (aquacultureAreas.length) {
      aquaculturePercent = this.recordSet('FishingValue', 'FishingValue', AQUACULTURE_ID).float('PERCENT', 0);
    }
    moorings = this.getChildren(MOORING_ID);
    if (moorings.length) {
      mooringPercent = this.recordSet('FishingValue', 'FishingValue', MOORING_ID).float('PERCENT', 2);
    }
    fishingAreas = this.getChildren(FISHING_PRIORITY_AREA_ID);
    if (fishingAreas.length) {
      fishingAreaPercent = this.recordSet('FishingPriorityArea', 'FishingPriorityArea', FISHING_PRIORITY_AREA_ID).float('PERCENT', 0);
    }
    noNetZones = this.getChildren(NO_NET_ZONES_ID);
    if (noNetZones.length) {
      noNetZonesPercent = this.recordSet('FishingValue', 'FishingValue', NO_NET_ZONES_ID).float('PERCENT', 0);
    }
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user),
      sanctuaryPercent: sanctuaryPercent,
      numSanctuaries: sanctuaries.length,
      sanctuaries: sanctuaries.length > 0,
      sancPlural: sanctuaries.length > 1,
      mooringAreaPercent: mooringPercent,
      numMoorings: moorings.length,
      moorings: moorings.length > 0,
      mooringsPlural: moorings.length > 1,
      fishingAreaPercent: fishingAreaPercent,
      numFishingAreas: fishingAreas.length,
      fishingAreas: fishingAreas.length > 0,
      fishingAreasPlural: fishingAreas.length > 1,
      aquacultureAreaPercent: aquaculturePercent,
      numAquacultureAreas: aquacultureAreas.length,
      aquacultureAreas: aquacultureAreas.length > 0,
      aquacultureAreasPlural: aquacultureAreas.length > 1,
      noNetZonesPercent: noNetZonesPercent,
      numNoNetZones: noNetZones.length,
      hasNoNetZones: noNetZones.length > 0,
      noNetZonesPlural: noNetZones.length > 1
    };
    this.$el.html(this.template.render(context, templates));
    return this.enableLayerTogglers(this.$el);
  };

  return ArrayFishingValueTab;

})(ReportTab);

module.exports = ArrayFishingValueTab;


},{"../templates/templates.js":17,"./ids.coffee":15,"reportTab":"a21iR2"}],12:[function(require,module,exports){
var ArrayHabitatTab, ReportTab, ids, key, templates, value, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

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
    _ref = ArrayHabitatTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  ArrayHabitatTab.prototype.name = 'Habitat';

  ArrayHabitatTab.prototype.className = 'habitat';

  ArrayHabitatTab.prototype.template = templates.arrayHabitats;

  ArrayHabitatTab.prototype.dependencies = ['BarbudaHabitat'];

  ArrayHabitatTab.prototype.timeout = 240000;

  ArrayHabitatTab.prototype.render = function() {
    var aquaculture, aquacultureAreas, context, fishingAreaData, fishingAreas, mooringData, moorings, noNetZones, noNetZonesData, row, sanctuaries, sanctuary, _i, _len;
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
    aquacultureAreas = this.getChildren(AQUACULTURE_ID);
    if (aquacultureAreas.length) {
      aquaculture = this.recordSet('BarbudaHabitat', 'Habitats', AQUACULTURE_ID).toArray();
    }
    moorings = this.getChildren(MOORING_ID);
    if (moorings.length) {
      mooringData = this.recordSet('BarbudaHabitat', 'Habitats', MOORING_ID).toArray();
    }
    fishingAreas = this.getChildren(FISHING_PRIORITY_AREA_ID);
    if (fishingAreas.length) {
      fishingAreaData = this.recordSet('BarbudaHabitat', 'Habitats', FISHING_PRIORITY_AREA_ID).toArray();
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
      numAquaculture: aquacultureAreas.length,
      aquacultureAreas: aquacultureAreas.length > 0,
      aquaPlural: aquacultureAreas.length > 1,
      aquacultureHabitat: aquaculture,
      moorings: moorings.length > 0,
      numMoorings: moorings.length,
      mooringData: mooringData,
      mooringPlural: moorings.length > 1,
      fishingAreas: fishingAreas.length > 0,
      numFishingAreas: fishingAreas.length,
      fishingAreaData: fishingAreaData,
      fishingAreaPlural: fishingAreas.length > 1,
      hasNoNetZones: noNetZones.length > 0,
      numNoNetZones: noNetZones.length,
      noNetZonesData: noNetZonesData,
      noNetZonesPlural: noNetZones.length > 1
    };
    this.$el.html(this.template.render(context, templates));
    return this.enableLayerTogglers(this.$el);
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
    var aquacultureAreas, aquacultureLagoonArea, aquacultureLagoonPercent, aquacultureOceanArea, aquacultureOceanPercent, context, fishingAreas, fishingAreasLagoonArea, fishingAreasLagoonPercent, fishingAreasOceanArea, fishingAreasOceanPercent, hasSketches, moorings, mooringsLagoonArea, mooringsLagoonPercent, mooringsOceanArea, mooringsOceanPercent, noNetZones, noNetZonesLagoonArea, noNetZonesLagoonPercent, noNetZonesOceanArea, noNetZonesOceanPercent, numAquacultureAreas, numFishingAreas, numMoorings, numNoNetZones, numSanctuaries, numTotalZones, sanctuaries, sanctuaryLagoonArea, sanctuaryLagoonPercent, sanctuaryOceanArea, sanctuaryOceanPercent, sumLagoonArea, sumLagoonPercent, sumOceanArea, sumOceanPercent;
    sanctuaries = [];
    aquacultureAreas = [];
    moorings = [];
    noNetZones = [];
    fishingAreas = [];
    sanctuaries = _.filter(this.children, function(c) {
      return c.get('sketchclass') === SANCTUARY_ID;
    });
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
    aquacultureAreas = _.filter(this.children, function(c) {
      return c.get('sketchclass') === AQUACULTURE_ID;
    });
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
    moorings = _.filter(this.children, function(c) {
      return c.get('sketchclass') === MOORING_ID;
    });
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
    noNetZones = _.filter(this.children, function(c) {
      return c.get('sketchclass') === NO_NET_ZONES_ID;
    });
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
    fishingAreas = _.filter(this.children, function(c) {
      return c.get('sketchclass') === FISHING_PRIORITY_AREA_ID;
    });
    numFishingAreas = fishingAreas.length;
    if (numFishingAreas > 0) {
      fishingAreasOceanArea = this.recordSet('Diameter', 'Diameter', FISHING_PRIORITY_AREA_ID).float('OCEAN_AREA', 0);
      fishingAreasLagoonArea = this.recordSet('Diameter', 'Diameter', FISHING_PRIORITY_AREA_ID).float('LAGOON_AREA', 0);
      fishingAreasOceanPercent = this.recordSet('Diameter', 'Diameter', FISHING_PRIORITY_AREA_ID).float('OCEAN_PERCENT', 0);
      fishingAreasLagoonPercent = this.recordSet('Diameter', 'Diameter', FISHING_PRIORITY_AREA_ID).float('LAGOON_PERCENT', 0);
    } else {
      fishingAreasOceanArea = 0;
      fishingAreasOceanPercent = 0.0;
      fishingAreasLagoonArea = 0;
      fishingAreasLagoonPercent = 0.0;
    }
    numTotalZones = numSanctuaries + numNoNetZones + numAquacultureAreas + numMoorings + numFishingAreas;
    sumOceanArea = sanctuaryOceanArea + noNetZonesOceanArea + aquacultureOceanArea + mooringsOceanArea + fishingAreasOceanArea;
    sumOceanPercent = sanctuaryOceanPercent + noNetZonesOceanPercent + aquacultureOceanPercent + mooringsOceanPercent + fishingAreasOceanPercent;
    sumLagoonArea = sanctuaryLagoonArea + noNetZonesLagoonArea + aquacultureLagoonArea + mooringsLagoonArea + fishingAreasLagoonArea;
    sumLagoonPercent = sanctuaryLagoonPercent + noNetZonesLagoonPercent + aquacultureLagoonPercent + mooringsLagoonPercent + fishingAreasLagoonPercent;
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
      numFishingAreas: fishingAreas.length,
      hasFishingAreas: fishingAreas.length > 0,
      fishingAreasPlural: fishingAreas.length > 1,
      fishingAreasOceanPercent: round(fishingAreasOceanPercent, 2),
      fishingAreasOceanArea: round(fishingAreasOceanArea, 1),
      fishingAreasLagoonArea: round(fishingAreasLagoonArea, 2),
      fishingAreasLagoonPercent: round(fishingAreasLagoonPercent, 1),
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
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user)
    };
    this.$el.html(this.template.render(context, partials));
    if (window.d3) {
      tradeoff_data = this.recordSet('TradeoffsPropId', 'TradeoffsPropId').toArray();
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
        return tooltip.style("visibility", "visible").html("<ul><strong>Proposal: " + d.PROPOSAL + "</strong><li> Fishing value: " + d.FISH_VAL + "</li><li> Conservation value: " + d.ECO_VAL + "</li></ul>");
      });
      mychart.pointsSelect().on("mousemove", function(d) {
        return tooltip.style("top", (event.pageY - 10) + "px").style("left", (calc_ttip(event.pageX, d, tooltip)) + "px");
      });
      mychart.pointsSelect().on("mouseout", function(d) {
        return tooltip.style("visibility", "hidden");
      });
      mychart.labelsSelect().on("mouseover", function(d) {
        return tooltip.style("visibility", "visible").html("<ul><strong>Proposal: " + d.PROPOSAL + "</strong><li> Fishing value: " + d.FISH_VAL + "</li><li> Conservation value: " + d.ECO_VAL + "</li></ul>");
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
          return d.PROPOSAL;
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
          return d.PROPOSAL;
        }).attr("x", function(d, i) {
          var overlap_xstart, string_end, xpos;
          xpos = xscale(x[i]);
          string_end = xpos + this.getComputedTextLength();
          overlap_xstart = xpos - (this.getComputedTextLength() + 5);
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
  SANCTUARY_ID: '51faebef8faa309b7c05de02',
  AQUACULTURE_ID: '520bb1c00bd22c9b2147b99b',
  MOORING_ID: '520d3dc4674659cb7b3480f5',
  FISHING_PRIORITY_AREA_ID: '520bb1d00bd22c9b2147b9d0',
  NO_NET_ZONES_ID: '524c5bc22fbd726117000034'
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
this["Templates"]["arrayFishingValue"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Displaced Fishing Value</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);if(_.s(_.f("sanctuaries",c,p,1),c,p,0,103,389,"{{ }}")){_.rs(c,p,function(c,p,_){if(_.s(_.f("aquacultureAreas",c,p,1),c,p,0,129,363,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    This proposal includes both Sanctuary and Aquaculture areas, displacing");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("sanctuaryPercent",c,p,0)));_.b("%</strong> and <strong>");_.b(_.v(_.f("aquacultureAreaPercent",c,p,0)));_.b("%</strong> ");_.b("\n" + i);_.b("    of fishing value within Barbuda's waters, respectively.");_.b("\n");});c.pop();}});c.pop();}if(_.s(_.f("sanctuaries",c,p,1),c,p,0,426,765,"{{ }}")){_.rs(c,p,function(c,p,_){if(!_.s(_.f("aquacultureAreas",c,p,1),c,p,1,0,0,"")){_.b("    This proposal includes ");_.b(_.v(_.f("numSanctuaries",c,p,0)));_.b("\n" + i);_.b("    ");if(_.s(_.f("sancPlural",c,p,1),c,p,0,518,529,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("Sanctuaries");});c.pop();}if(!_.s(_.f("sancPlural",c,p,1),c,p,1,0,0,"")){_.b("Sanctuary");};_.b(",");_.b("\n" + i);_.b("    displacing <strong>");_.b(_.v(_.f("sanctuaryPercent",c,p,0)));_.b("%</strong> of fishing value within ");_.b("\n" + i);_.b("    Barbuda's waters based on user reported values of fishing grounds.");_.b("\n");};});c.pop();}if(!_.s(_.f("sanctuaries",c,p,1),c,p,1,0,0,"")){if(_.s(_.f("aquacultureAreas",c,p,1),c,p,0,828,1135,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <br>");_.b("\n" + i);_.b("    <br>");_.b("\n" + i);_.b("    This proposal includes ");_.b(_.v(_.f("numAquacultureAreas",c,p,0)));_.b("\n" + i);_.b("    Aquaculture Area");if(_.s(_.f("aquacultureAreasPlural",c,p,1),c,p,0,945,946,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b(",");_.b("\n" + i);_.b("    displacing <strong>");_.b(_.v(_.f("aquacultureAreaPercent",c,p,0)));_.b("%</strong> of fishing value within ");_.b("\n" + i);_.b("    Barbuda's waters based on user reported values of fishing grounds.");_.b("\n");});c.pop();}};if(_.s(_.f("moorings",c,p,1),c,p,0,1195,1525,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <br>");_.b("\n" + i);_.b("    <br>");_.b("\n" + i);_.b("    ");_.b(_.v(_.f("numMoorings",c,p,0)));_.b(" Mooring Area");if(_.s(_.f("mooringsPlural",c,p,1),c,p,0,1265,1270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s are");});c.pop();}_.b(" ");if(!_.s(_.f("mooringsPlural",c,p,1),c,p,1,0,0,"")){_.b("is");};_.b("\n" + i);_.b("    also included, which cover");if(!_.s(_.f("mooringsPlural",c,p,1),c,p,1,0,0,"")){_.b("s");};_.b(" <strong>");_.b(_.v(_.f("mooringAreaPercent",c,p,0)));_.b("%</strong> of ");_.b("\n" + i);_.b("    regional fishing value. Mooring areas may displace fishing activities.");_.b("\n");});c.pop();}if(_.s(_.f("hasNoNetZones",c,p,1),c,p,0,1561,1903,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <br>");_.b("\n" + i);_.b("    <br>");_.b("\n" + i);_.b("    ");_.b(_.v(_.f("numNoNetZones",c,p,0)));_.b(" Not Net Zone");if(_.s(_.f("noNetZonesPlural",c,p,1),c,p,0,1635,1640,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s are");});c.pop();}_.b(" ");if(!_.s(_.f("noNetZonesPlural",c,p,1),c,p,1,0,0,"")){_.b("is");};_.b("\n" + i);_.b("    also included, which cover");if(!_.s(_.f("noNetZonesPlural",c,p,1),c,p,1,0,0,"")){_.b("s");};_.b(" <strong>");_.b(_.v(_.f("noNetZonesPercent",c,p,0)));_.b("%</strong> of ");_.b("\n" + i);_.b("    regional fishing value. No Net Zones may displace fishing activities.");_.b("\n");});c.pop();}_.b("  </p>");_.b("\n" + i);_.b("  <a href=\"#\" data-toggle-node=\"533f16f6a498867c56c6fb57\">show fishing values layer</a>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);if(_.s(_.f("fishingAreas",c,p,1),c,p,0,2042,2414,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Priority Fishing Areas</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This proposal includes ");_.b(_.v(_.f("numFishingAreas",c,p,0)));_.b(" Fishing Priority ");_.b("\n" + i);_.b("    Area");if(_.s(_.f("fishingAreaPural",c,p,1),c,p,0,2219,2220,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b(", representing");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("fishingAreaPercent",c,p,0)));_.b("%</strong> of the fishing value within Barbuda's ");_.b("\n" + i);_.b("    waters based on user reported values of fishing grounds");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}return _.fl();;});
this["Templates"]["arrayHabitats"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.f("sanctuaries",c,p,1),c,p,0,16,919,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Habitats within ");_.b(_.v(_.f("numSanctuaries",c,p,0)));_.b(" ");if(!_.s(_.f("sanctuaryPlural",c,p,1),c,p,1,0,0,"")){_.b("Sanctuary");};if(_.s(_.f("sanctuaryPlural",c,p,1),c,p,0,170,181,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("Sanctuaries");});c.pop();}_.b("</h4>");_.b("\n" + i);_.b("  <table>");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Habitat</th>");_.b("\n" + i);_.b("        <th>Percent of Total Habitat</th>");_.b("\n" + i);_.b("        <th>Meets 33% goal</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("sanctuaryHabitat",c,p,1),c,p,0,403,616,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr class=\"");if(_.s(_.f("meetsGoal",c,p,1),c,p,0,435,442,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("metGoal");});c.pop();}_.b("\">");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HabType",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Percent",c,p,0)));_.b(" %</td>");_.b("\n" + i);_.b("        <td>");if(_.s(_.f("meetsGoal",c,p,1),c,p,0,545,548,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("yes");});c.pop();}if(!_.s(_.f("meetsGoal",c,p,1),c,p,1,0,0,"")){_.b("no");};_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    Percentages shown represent the proportion of habitats available in ");_.b("\n" + i);_.b("    Barbuda's entire 3 nautical mile boundary captured within sanctuaries. <br>");_.b("\n" + i);_.b("    <a href=\"#\" data-toggle-node=\"533ddf86a498867c56c6c830\">show habitats layer</a>");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);if(_.s(_.f("aquacultureAreas",c,p,1),c,p,0,958,1588,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Habitats within ");_.b(_.v(_.f("numAquaculture",c,p,0)));_.b(" Aquaculture Area");if(_.s(_.f("aquaPlural",c,p,1),c,p,0,1074,1075,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</h4>");_.b("\n" + i);_.b("  <table>");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Habitat</th>");_.b("\n" + i);_.b("        <th>Percent of Total Habitat</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("aquacultureHabitat",c,p,1),c,p,0,1262,1352,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HabType",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Percent",c,p,0)));_.b(" %</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("<!--   <p>");_.b("\n" + i);_.b("    Percentages shown represent the proportion of habitats available in ");_.b("\n" + i);_.b("    Barbuda's entire 3 nautical mile boundary captured within aquaculture ");_.b("\n" + i);_.b("    areas.");_.b("\n" + i);_.b("  </p> -->");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);if(_.s(_.f("moorings",c,p,1),c,p,0,1624,2235,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Habitats within ");_.b(_.v(_.f("numMoorings",c,p,0)));_.b(" Mooring Area");if(_.s(_.f("mooringPlural",c,p,1),c,p,0,1736,1737,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</h4>");_.b("\n" + i);_.b("  <table>");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Habitat</th>");_.b("\n" + i);_.b("        <th>Percent of Total Habitat</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("mooringData",c,p,1),c,p,0,1920,2010,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HabType",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Percent",c,p,0)));_.b(" %</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("<!--   <p>");_.b("\n" + i);_.b("    Percentages shown represent the proportion of habitats available in ");_.b("\n" + i);_.b("    Barbuda's entire 3 nautical mile boundary captured within mooring ");_.b("\n" + i);_.b("    areas.");_.b("\n" + i);_.b("  </p> -->");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);if(_.s(_.f("fishingAreas",c,p,1),c,p,0,2267,2916,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Habitats within ");_.b(_.v(_.f("numFishingAreas",c,p,0)));_.b(" Fishing Priority Area");if(_.s(_.f("fishingAreaPlural",c,p,1),c,p,0,2396,2397,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</h4>");_.b("\n" + i);_.b("  <table>");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Habitat</th>");_.b("\n" + i);_.b("        <th>Percent of Total Habitat</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("fishingAreaData",c,p,1),c,p,0,2588,2678,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HabType",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Percent",c,p,0)));_.b(" %</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <p>");_.b("\n" + i);_.b("    Percentages shown represent the proportion of habitats available in ");_.b("\n" + i);_.b("    Barbuda's entire 3 nautical mile boundary captured within fishing ");_.b("\n" + i);_.b("    priority areas.");_.b("\n" + i);_.b("  </p> -->");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);if(_.s(_.f("hasNoNetZones",c,p,1),c,p,0,2953,3571,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Habitats within ");_.b(_.v(_.f("numNoNetZones",c,p,0)));_.b(" No Net Zone");if(_.s(_.f("noNetZonesPlural",c,p,1),c,p,0,3069,3070,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</h4>");_.b("\n" + i);_.b("  <table>");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Habitat</th>");_.b("\n" + i);_.b("        <th>Percent of Total Habitat</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("noNetZonesData",c,p,1),c,p,0,3259,3349,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HabType",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Percent",c,p,0)));_.b(" %</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <p>");_.b("\n" + i);_.b("    Percentages shown represent the proportion of habitats available in ");_.b("\n" + i);_.b("    Barbuda's entire 3 nautical mile boundary captured within no net zones.");_.b("\n" + i);_.b("  </p> -->");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}return _.fl();;});
this["Templates"]["arrayOverview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<div class=\"reportSection size\">");_.b("\n" + i);_.b("  <h4>Size</h4>");_.b("\n" + i);if(_.s(_.f("hasSketches",c,p,1),c,p,0,363,874,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p class=\"large\">");_.b("\n" + i);_.b("    This collection is composed of <strong>");_.b(_.v(_.f("numSketches",c,p,0)));_.b(" zone");if(_.s(_.f("sketchesPlural",c,p,1),c,p,0,468,469,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</strong> in both ocean and lagoon waters. The collection includes a total <em>oceanic</em> area of <strong>");_.b(_.v(_.f("sumOceanArea",c,p,0)));_.b(" square miles</strong>, which represents <strong>");_.b(_.v(_.f("sumOceanPercent",c,p,0)));_.b("%</strong> of Barbuda's waters. It also incorporates ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("sumLagoonArea",c,p,0)));_.b(" square miles</strong>, or <strong>");_.b(_.v(_.f("sumLagoonPercent",c,p,0)));_.b("%</strong>, of the total <em>lagoon area</em>.");_.b("\n" + i);_.b("  </p>");_.b("\n");});c.pop();}if(_.s(_.f("hasSanctuaries",c,p,1),c,p,0,914,1653,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p class=\"large\">");_.b("\n" + i);_.b("    The collection includes <strong>");_.b(_.v(_.f("numSanctuaries",c,p,0)));_.b(" ");if(!_.s(_.f("sanctuariesPlural",c,p,1),c,p,1,0,0,"")){_.b("sanctuary");};if(_.s(_.f("sanctuariesPlural",c,p,1),c,p,0,1067,1078,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("sanctuaries");});c.pop();}_.b("</strong> in both ocean and lagoon waters. The ");if(!_.s(_.f("sanctuariesPlural",c,p,1),c,p,1,0,0,"")){_.b("sanctuary");};if(_.s(_.f("sanctuariesPlural",c,p,1),c,p,0,1222,1233,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("sanctuaries");});c.pop();}_.b(" contain");if(!_.s(_.f("sanctuariesPlural",c,p,1),c,p,1,0,0,"")){_.b("s");};_.b(" a total <em>oceanic</em> area of <strong>");_.b(_.v(_.f("sanctuaryOceanArea",c,p,0)));_.b(" square miles</strong>, ");_.b("\n" + i);_.b("    which represents <strong>");_.b(_.v(_.f("sanctuaryOceanPercent",c,p,0)));_.b("%</strong> of Barbuda's waters. It also includes ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("sanctuaryLagoonArea",c,p,0)));_.b(" square miles</strong>, or <strong>");_.b(_.v(_.f("sanctuaryLagoonPercent",c,p,0)));_.b("%</strong>, of the total <em>lagoon area</em>.");_.b("\n" + i);_.b("  </p>");_.b("\n");});c.pop();}if(_.s(_.f("hasNoNetZones",c,p,1),c,p,0,1693,2329,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p class=\"large\">");_.b("\n" + i);_.b("    The collection includes <strong>");_.b(_.v(_.f("numNoNetZones",c,p,0)));_.b(" No Net Zone");if(_.s(_.f("noNetZonesPlural",c,p,1),c,p,0,1802,1803,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</strong> in both ocean and lagoon waters. The No Net Zone");if(_.s(_.f("noNetZonesPlural",c,p,1),c,p,0,1903,1904,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</strong> contain");if(!_.s(_.f("noNetZonesPlural",c,p,1),c,p,1,0,0,"")){_.b("s");};_.b(" a total <em>oceanic</em> area of <strong>");_.b(_.v(_.f("noNetZonesOceanArea",c,p,0)));_.b(" square miles</strong>, which represents <strong>");_.b(_.v(_.f("noNetZonesOceanPercent",c,p,0)));_.b("%</strong> of Barbuda's waters. It also includes ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("noNetZonesLagoonArea",c,p,0)));_.b(" square miles</strong>, or <strong>");_.b(_.v(_.f("noNetZonesLagoonPercent",c,p,0)));_.b("%</strong>, of the total <em>lagoon area</em>.");_.b("\n" + i);_.b("  </p>");_.b("\n");});c.pop();}if(_.s(_.f("hasMoorings",c,p,1),c,p,0,2366,2978,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p class=\"large\">");_.b("\n" + i);_.b("    The collection includes <strong>");_.b(_.v(_.f("numMoorings",c,p,0)));_.b(" Mooring Area");if(_.s(_.f("mooringsPlural",c,p,1),c,p,0,2472,2473,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</strong> in both ocean and lagoon waters. The Mooring Area");if(_.s(_.f("mooringsPlural",c,p,1),c,p,0,2570,2571,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b(" contain");if(!_.s(_.f("mooringsPlural",c,p,1),c,p,1,0,0,"")){_.b("s");};_.b(" a total <em>oceanic</em> area of <strong>");_.b(_.v(_.f("mooringsOceanArea",c,p,0)));_.b(" square miles</strong>, ");_.b("\n" + i);_.b("    which represents <strong>");_.b(_.v(_.f("mooringsOceanPercent",c,p,0)));_.b("%</strong> of Barbuda's waters. It also includes ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("mooringsLagoonArea",c,p,0)));_.b(" square miles</strong>, or <strong>");_.b(_.v(_.f("mooringsLagoonPercent",c,p,0)));_.b("%</strong>, of the total <em>lagoon area</em>.");_.b("\n" + i);_.b("  </p>");_.b("\n");});c.pop();}if(_.s(_.f("hasAquaculture",c,p,1),c,p,0,3016,3664,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p class=\"large\">");_.b("\n" + i);_.b("    The collection includes <strong>");_.b(_.v(_.f("numAquaculture",c,p,0)));_.b(" Aquaculture Area");if(_.s(_.f("aquaculturePlural",c,p,1),c,p,0,3132,3133,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</strong> in both ocean and lagoon waters. The Aquaculture Area");if(_.s(_.f("aquaculturePlural",c,p,1),c,p,0,3240,3241,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b(" contain");if(!_.s(_.f("aquaculturePlural",c,p,1),c,p,1,0,0,"")){_.b("s");};_.b(" a total <em>oceanic</em> area of <strong>");_.b(_.v(_.f("aquacultureOceanArea",c,p,0)));_.b(" square miles</strong>, which represents <strong>");_.b(_.v(_.f("aquacultureOceanPercent",c,p,0)));_.b("%</strong> of Barbuda's waters. It also includes ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("aquacultureLagoonArea",c,p,0)));_.b(" square miles</strong>, or <strong>");_.b(_.v(_.f("aquacultureLagoonPercent",c,p,0)));_.b("%</strong>, of the total <em>lagoon area</em>.");_.b("\n" + i);_.b("  </p>");_.b("\n");});c.pop();}if(_.s(_.f("hasFishingAreas",c,p,1),c,p,0,3706,4375,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p class=\"large\">");_.b("\n" + i);_.b("    The collection includes <strong>");_.b(_.v(_.f("numFishingAreas",c,p,0)));_.b(" Fishing Priority Area");if(_.s(_.f("fishingAreasPlural",c,p,1),c,p,0,3829,3830,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b("</strong> in both ocean and lagoon waters. The Fishing Priority Area");if(_.s(_.f("fishingAreasPlural",c,p,1),c,p,0,3944,3945,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("s");});c.pop();}_.b(" contain");if(!_.s(_.f("fishingAreasPlural",c,p,1),c,p,1,0,0,"")){_.b("s");};_.b(" a total <em>oceanic</em> area of <strong>");_.b(_.v(_.f("fishingAreasOceanArea",c,p,0)));_.b(" square miles</strong>, which represents <strong>");_.b(_.v(_.f("fishingAreasOceanPercent",c,p,0)));_.b("%</strong> of Barbuda's waters. It also includes ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("fishingAreasLagoonArea",c,p,0)));_.b(" square miles</strong>, or <strong>");_.b(_.v(_.f("fishingAreasLagoonPercent",c,p,0)));_.b("%</strong>, of the total <em>lagoon area</em>.");_.b("\n" + i);_.b("  </p>");_.b("\n");});c.pop();}_.b("</div>");_.b("\n" + i);_.b("<!--");_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Zones in this Proposal</h4>");_.b("\n" + i);_.b("  <div class=\"tocContainer\"></div>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("-->");_.b("\n" + i);if(_.s(_.f("anyAttributes",c,p,1),c,p,0,4534,4658,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" Attributes</h4>");_.b("\n" + i);_.b(_.rp("attributes/attributesTable",c,p,"  "));_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}return _.fl();;});
this["Templates"]["arrayTradeoffs"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Tradeoffs</h4>");_.b("\n" + i);_.b("	<p class=\"small ttip-tip\">");_.b("\n" + i);_.b("	   Tip: hover over a proposal to see details");_.b("\n" + i);_.b("	</p>");_.b("\n" + i);_.b("  	<div  id=\"tradeoff-chart\" class=\"tradeoff-chart\"></div>");_.b("\n" + i);_.b("</div>");return _.fl();;});
this["Templates"]["demo"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Report Sections</h4>");_.b("\n" + i);_.b("  <p>Use report sections to group information into meaningful categories</p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>D3 Visualizations</h4>");_.b("\n" + i);_.b("  <ul class=\"nav nav-pills\" id=\"tabs2\">");_.b("\n" + i);_.b("    <li class=\"active\"><a href=\"#chart\">Chart</a></li>");_.b("\n" + i);_.b("    <li><a href=\"#dataTable\">Table</a></li>");_.b("\n" + i);_.b("  </ul>");_.b("\n" + i);_.b("  <div class=\"tab-content\">");_.b("\n" + i);_.b("    <div class=\"tab-pane active\" id=\"chart\">");_.b("\n" + i);_.b("      <!--[if IE 8]>");_.b("\n" + i);_.b("      <p class=\"unsupported\">");_.b("\n" + i);_.b("      This visualization is not compatible with Internet Explorer 8. ");_.b("\n" + i);_.b("      Please upgrade your browser, or view results in the table tab.");_.b("\n" + i);_.b("      </p>      ");_.b("\n" + i);_.b("      <![endif]-->");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        See <code>src/scripts/demo.coffee</code> for an example of how to ");_.b("\n" + i);_.b("        use d3.js to render visualizations. Provide a table-based view");_.b("\n" + i);_.b("        and use conditional comments to provide a fallback for IE8 users.");_.b("\n" + i);_.b("        <br>");_.b("\n" + i);_.b("        <a href=\"http://twitter.github.io/bootstrap/2.3.2/\">Bootstrap 2.x</a>");_.b("\n" + i);_.b("        is loaded within SeaSketch so you can use it to create tabs and other ");_.b("\n" + i);_.b("        interface components. jQuery and underscore are also available.");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("    </div>");_.b("\n" + i);_.b("    <div class=\"tab-pane\" id=\"dataTable\">");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>index</th>");_.b("\n" + i);_.b("            <th>value</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("chartData",c,p,1),c,p,0,1351,1418,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr><td>");_.b(_.v(_.f("index",c,p,0)));_.b("</td><td>");_.b(_.v(_.f("value",c,p,0)));_.b("</td></tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("    </div>");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection emphasis\">");_.b("\n" + i);_.b("  <h4>Emphasis</h4>");_.b("\n" + i);_.b("  <p>Give report sections an <code>emphasis</code> class to highlight important information.</p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection warning\">");_.b("\n" + i);_.b("  <h4>Warning</h4>");_.b("\n" + i);_.b("  <p>Or <code>warn</code> of potential problems.</p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection danger\">");_.b("\n" + i);_.b("  <h4>Danger</h4>");_.b("\n" + i);_.b("  <p><code>danger</code> can also be used... sparingly.</p>");_.b("\n" + i);_.b("</div>");return _.fl();;});
this["Templates"]["fishingPriorityArea"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Fishing Value</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This fishing priority area includes <strong>");_.b(_.v(_.f("percent",c,p,0)));_.b("%</strong> of the ");_.b("\n" + i);_.b("    fishing value within Barbuda's waters, based on user reported values of ");_.b("\n" + i);_.b("    fishing grounds");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <a href=\"#\" data-toggle-node=\"533f16f6a498867c56c6fb57\">show fishing values layer</a>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});
this["Templates"]["fishingValue"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Fishing Value</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This ");_.b(_.v(_.f("areaLabel",c,p,0)));_.b(" displaces <strong>");_.b(_.v(_.f("percent",c,p,0)));_.b("%</strong> ");_.b("\n" + i);_.b("    of the fishing value within Barbuda’s waters, based on user reported");_.b("\n" + i);_.b("    values of fishing grounds.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <a href=\"#\" data-toggle-node=\"533f16f6a498867c56c6fb57\">show fishing values layer</a>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});
this["Templates"]["habitat"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>");_.b(_.v(_.f("heading",c,p,0)));_.b("</h4>");_.b("\n" + i);_.b("  <table>");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Habitat</th>");_.b("\n" + i);_.b("        <th>% of Total Habitat</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("habitats",c,p,1),c,p,0,216,279,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr><td>");_.b(_.v(_.f("HabType",c,p,0)));_.b("</td><td>");_.b(_.v(_.f("Percent",c,p,0)));_.b("</td></tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    Percentages shown represent the proportion of habitats available in ");_.b("\n" + i);_.b("    Barbuda's entire 3 nautical mile boundary captured within this zone. <br>");_.b("\n" + i);_.b("    <a href=\"#\" data-toggle-node=\"533ddf86a498867c56c6c830\">show habitats layer</a>");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});
this["Templates"]["overview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<div class=\"reportSection size\">");_.b("\n" + i);_.b("  <h4>Size</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This area is <strong>");_.b(_.v(_.f("SQ_MILES",c,p,0)));_.b(" square miles</strong>,");_.b("\n" + i);_.b("    which represents <strong>");_.b(_.v(_.f("PERCENT",c,p,0)));_.b("%</strong> of Barbuda's waters.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);if(_.s(_.f("renderMinimumWidth",c,p,1),c,p,0,536,1178,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection diameter ");if(!_.s(_.f("DIAM_OK",c,p,1),c,p,1,0,0,"")){_.b("warning");};_.b("\">");_.b("\n" + i);_.b("  <h4>Minimum Width</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    The minimum width of a zone significantly impacts  its conservation value. ");_.b("\n" + i);_.b("    The recommended smallest diameter is between 2 and 3 miles.");_.b("\n" + i);_.b("    <strong>");_.b("\n" + i);if(!_.s(_.f("DIAM_OK",c,p,1),c,p,1,0,0,"")){_.b("    This design falls outside the recommendation at ");_.b(_.v(_.f("DIAM",c,p,0)));_.b(" miles.");_.b("\n");};if(_.s(_.f("DIAM_OK",c,p,1),c,p,0,926,997,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    This design fits within the recommendation at ");_.b(_.v(_.f("DIAM",c,p,0)));_.b(" miles.");_.b("\n");});c.pop();}_.b("    </strong>");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <div class=\"viz\" style=\"position:relative;\"></div>");_.b("\n" + i);_.b("  <img src=\"http://s3.amazonaws.com/SeaSketch/projects/barbuda/min_width_example.png\">");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);if(_.s(_.f("anyAttributes",c,p,1),c,p,0,1221,1345,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" Attributes</h4>");_.b("\n" + i);_.b(_.rp("attributes/attributesTable",c,p,"  "));_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}return _.fl();;});

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = this["Templates"];
}
},{}]},{},[16])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL3RyYWluaW5nLXJlcG9ydHMtdjIvbm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvdHJhaW5pbmctcmVwb3J0cy12Mi9ub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9saWIvX2VtcHR5LmpzIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL2VuYWJsZUxheWVyVG9nZ2xlcnMuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL2pvYkl0ZW0uY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL3JlcG9ydFJlc3VsdHMuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL3JlcG9ydFRhYi5jb2ZmZWUiLCIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL3RyYWluaW5nLXJlcG9ydHMtdjIvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvdXRpbHMuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL3NjcmlwdHMvYXJyYXlGaXNoaW5nVmFsdWVUYWIuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL3NjcmlwdHMvYXJyYXlIYWJpdGF0VGFiLmNvZmZlZSIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvdHJhaW5pbmctcmVwb3J0cy12Mi9zY3JpcHRzL2FycmF5T3ZlcnZpZXdUYWIuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL3NjcmlwdHMvYXJyYXlUcmFkZW9mZnMuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL3NjcmlwdHMvaWRzLmNvZmZlZSIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvdHJhaW5pbmctcmVwb3J0cy12Mi9zY3JpcHRzL3Byb3Bvc2FsLmNvZmZlZSIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvdHJhaW5pbmctcmVwb3J0cy12Mi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7O0FDQUEsQ0FBTyxDQUFVLENBQUEsR0FBWCxDQUFOLEVBQWtCO0NBQ2hCLEtBQUEsMkVBQUE7Q0FBQSxDQUFBLENBQUE7Q0FBQSxDQUNBLENBQUEsR0FBWTtDQURaLENBRUEsQ0FBQSxHQUFNO0FBQ0MsQ0FBUCxDQUFBLENBQUEsQ0FBQTtDQUNFLEVBQUEsQ0FBQSxHQUFPLHFCQUFQO0NBQ0EsU0FBQTtJQUxGO0NB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dCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsbnVsbCwibW9kdWxlLmV4cG9ydHMgPSAoZWwpIC0+XG4gICRlbCA9ICQgZWxcbiAgYXBwID0gd2luZG93LmFwcFxuICB0b2MgPSBhcHAuZ2V0VG9jKClcbiAgdW5sZXNzIHRvY1xuICAgIGNvbnNvbGUubG9nICdObyB0YWJsZSBvZiBjb250ZW50cyBmb3VuZCdcbiAgICByZXR1cm5cbiAgdG9nZ2xlcnMgPSAkZWwuZmluZCgnYVtkYXRhLXRvZ2dsZS1ub2RlXScpXG4gICMgU2V0IGluaXRpYWwgc3RhdGVcbiAgZm9yIHRvZ2dsZXIgaW4gdG9nZ2xlcnMudG9BcnJheSgpXG4gICAgJHRvZ2dsZXIgPSAkKHRvZ2dsZXIpXG4gICAgbm9kZWlkID0gJHRvZ2dsZXIuZGF0YSgndG9nZ2xlLW5vZGUnKVxuICAgIHRyeVxuICAgICAgdmlldyA9IHRvYy5nZXRDaGlsZFZpZXdCeUlkIG5vZGVpZFxuICAgICAgbm9kZSA9IHZpZXcubW9kZWxcbiAgICAgICR0b2dnbGVyLmF0dHIgJ2RhdGEtdmlzaWJsZScsICEhbm9kZS5nZXQoJ3Zpc2libGUnKVxuICAgICAgJHRvZ2dsZXIuZGF0YSAndG9jSXRlbScsIHZpZXdcbiAgICBjYXRjaCBlXG4gICAgICAkdG9nZ2xlci5hdHRyICdkYXRhLW5vdC1mb3VuZCcsICd0cnVlJ1xuXG4gIHRvZ2dsZXJzLm9uICdjbGljaycsIChlKSAtPlxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICRlbCA9ICQoZS50YXJnZXQpXG4gICAgdmlldyA9ICRlbC5kYXRhKCd0b2NJdGVtJylcbiAgICBpZiB2aWV3XG4gICAgICB2aWV3LnRvZ2dsZVZpc2liaWxpdHkoZSlcbiAgICAgICRlbC5hdHRyICdkYXRhLXZpc2libGUnLCAhIXZpZXcubW9kZWwuZ2V0KCd2aXNpYmxlJylcbiAgICBlbHNlXG4gICAgICBhbGVydCBcIkxheWVyIG5vdCBmb3VuZCBpbiB0aGUgY3VycmVudCBUYWJsZSBvZiBDb250ZW50cy4gXFxuRXhwZWN0ZWQgbm9kZWlkICN7JGVsLmRhdGEoJ3RvZ2dsZS1ub2RlJyl9XCJcbiIsImNsYXNzIEpvYkl0ZW0gZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gIGNsYXNzTmFtZTogJ3JlcG9ydFJlc3VsdCdcbiAgZXZlbnRzOiB7fVxuICBiaW5kaW5nczpcbiAgICBcImg2IGFcIjpcbiAgICAgIG9ic2VydmU6IFwic2VydmljZU5hbWVcIlxuICAgICAgdXBkYXRlVmlldzogdHJ1ZVxuICAgICAgYXR0cmlidXRlczogW3tcbiAgICAgICAgbmFtZTogJ2hyZWYnXG4gICAgICAgIG9ic2VydmU6ICdzZXJ2aWNlVXJsJ1xuICAgICAgfV1cbiAgICBcIi5zdGFydGVkQXRcIjpcbiAgICAgIG9ic2VydmU6IFtcInN0YXJ0ZWRBdFwiLCBcInN0YXR1c1wiXVxuICAgICAgdmlzaWJsZTogKCkgLT5cbiAgICAgICAgQG1vZGVsLmdldCgnc3RhdHVzJykgbm90IGluIFsnY29tcGxldGUnLCAnZXJyb3InXVxuICAgICAgdXBkYXRlVmlldzogdHJ1ZVxuICAgICAgb25HZXQ6ICgpIC0+XG4gICAgICAgIGlmIEBtb2RlbC5nZXQoJ3N0YXJ0ZWRBdCcpXG4gICAgICAgICAgcmV0dXJuIFwiU3RhcnRlZCBcIiArIG1vbWVudChAbW9kZWwuZ2V0KCdzdGFydGVkQXQnKSkuZnJvbU5vdygpICsgXCIuIFwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBcIlwiXG4gICAgXCIuc3RhdHVzXCI6ICAgICAgXG4gICAgICBvYnNlcnZlOiBcInN0YXR1c1wiXG4gICAgICBvbkdldDogKHMpIC0+XG4gICAgICAgIHN3aXRjaCBzXG4gICAgICAgICAgd2hlbiAncGVuZGluZydcbiAgICAgICAgICAgIFwid2FpdGluZyBpbiBsaW5lXCJcbiAgICAgICAgICB3aGVuICdydW5uaW5nJ1xuICAgICAgICAgICAgXCJydW5uaW5nIGFuYWx5dGljYWwgc2VydmljZVwiXG4gICAgICAgICAgd2hlbiAnY29tcGxldGUnXG4gICAgICAgICAgICBcImNvbXBsZXRlZFwiXG4gICAgICAgICAgd2hlbiAnZXJyb3InXG4gICAgICAgICAgICBcImFuIGVycm9yIG9jY3VycmVkXCJcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBzXG4gICAgXCIucXVldWVMZW5ndGhcIjogXG4gICAgICBvYnNlcnZlOiBcInF1ZXVlTGVuZ3RoXCJcbiAgICAgIG9uR2V0OiAodikgLT5cbiAgICAgICAgcyA9IFwiV2FpdGluZyBiZWhpbmQgI3t2fSBqb2JcIlxuICAgICAgICBpZiB2Lmxlbmd0aCA+IDFcbiAgICAgICAgICBzICs9ICdzJ1xuICAgICAgICByZXR1cm4gcyArIFwiLiBcIlxuICAgICAgdmlzaWJsZTogKHYpIC0+XG4gICAgICAgIHY/IGFuZCBwYXJzZUludCh2KSA+IDBcbiAgICBcIi5lcnJvcnNcIjpcbiAgICAgIG9ic2VydmU6ICdlcnJvcidcbiAgICAgIHVwZGF0ZVZpZXc6IHRydWVcbiAgICAgIHZpc2libGU6ICh2KSAtPlxuICAgICAgICB2Py5sZW5ndGggPiAyXG4gICAgICBvbkdldDogKHYpIC0+XG4gICAgICAgIGlmIHY/XG4gICAgICAgICAgSlNPTi5zdHJpbmdpZnkodiwgbnVsbCwgJyAgJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgIG51bGxcblxuICBjb25zdHJ1Y3RvcjogKEBtb2RlbCkgLT5cbiAgICBzdXBlcigpXG5cbiAgcmVuZGVyOiAoKSAtPlxuICAgIEAkZWwuaHRtbCBcIlwiXCJcbiAgICAgIDxoNj48YSBocmVmPVwiI1wiIHRhcmdldD1cIl9ibGFua1wiPjwvYT48c3BhbiBjbGFzcz1cInN0YXR1c1wiPjwvc3Bhbj48L2g2PlxuICAgICAgPGRpdj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJzdGFydGVkQXRcIj48L3NwYW4+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwicXVldWVMZW5ndGhcIj48L3NwYW4+XG4gICAgICAgIDxwcmUgY2xhc3M9XCJlcnJvcnNcIj48L3ByZT5cbiAgICAgIDwvZGl2PlxuICAgIFwiXCJcIlxuICAgIEBzdGlja2l0KClcblxubW9kdWxlLmV4cG9ydHMgPSBKb2JJdGVtIiwiY2xhc3MgUmVwb3J0UmVzdWx0cyBleHRlbmRzIEJhY2tib25lLkNvbGxlY3Rpb25cblxuICBkZWZhdWx0UG9sbGluZ0ludGVydmFsOiAzMDAwXG5cbiAgY29uc3RydWN0b3I6IChAc2tldGNoLCBAZGVwcykgLT5cbiAgICBAdXJsID0gdXJsID0gXCIvcmVwb3J0cy8je0Bza2V0Y2guaWR9LyN7QGRlcHMuam9pbignLCcpfVwiXG4gICAgc3VwZXIoKVxuXG4gIHBvbGw6ICgpID0+XG4gICAgQGZldGNoIHtcbiAgICAgIHN1Y2Nlc3M6ICgpID0+XG4gICAgICAgIEB0cmlnZ2VyICdqb2JzJ1xuICAgICAgICBmb3IgcmVzdWx0IGluIEBtb2RlbHNcbiAgICAgICAgICBpZiByZXN1bHQuZ2V0KCdzdGF0dXMnKSBub3QgaW4gWydjb21wbGV0ZScsICdlcnJvciddXG4gICAgICAgICAgICB1bmxlc3MgQGludGVydmFsXG4gICAgICAgICAgICAgIEBpbnRlcnZhbCA9IHNldEludGVydmFsIEBwb2xsLCBAZGVmYXVsdFBvbGxpbmdJbnRlcnZhbFxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICMgYWxsIGNvbXBsZXRlIHRoZW5cbiAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoQGludGVydmFsKSBpZiBAaW50ZXJ2YWxcbiAgICAgICAgaWYgcHJvYmxlbSA9IF8uZmluZChAbW9kZWxzLCAocikgLT4gci5nZXQoJ2Vycm9yJyk/KVxuICAgICAgICAgIEB0cmlnZ2VyICdlcnJvcicsIFwiUHJvYmxlbSB3aXRoICN7cHJvYmxlbS5nZXQoJ3NlcnZpY2VOYW1lJyl9IGpvYlwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAdHJpZ2dlciAnZmluaXNoZWQnXG4gICAgICBlcnJvcjogKGUsIHJlcywgYSwgYikgPT5cbiAgICAgICAgdW5sZXNzIHJlcy5zdGF0dXMgaXMgMFxuICAgICAgICAgIGlmIHJlcy5yZXNwb25zZVRleHQ/Lmxlbmd0aFxuICAgICAgICAgICAgdHJ5XG4gICAgICAgICAgICAgIGpzb24gPSBKU09OLnBhcnNlKHJlcy5yZXNwb25zZVRleHQpXG4gICAgICAgICAgICBjYXRjaFxuICAgICAgICAgICAgICAjIGRvIG5vdGhpbmdcbiAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChAaW50ZXJ2YWwpIGlmIEBpbnRlcnZhbFxuICAgICAgICAgIEB0cmlnZ2VyICdlcnJvcicsIGpzb24/LmVycm9yPy5tZXNzYWdlIG9yIFxuICAgICAgICAgICAgJ1Byb2JsZW0gY29udGFjdGluZyB0aGUgU2VhU2tldGNoIHNlcnZlcidcbiAgICB9XG5cbm1vZHVsZS5leHBvcnRzID0gUmVwb3J0UmVzdWx0c1xuIiwiZW5hYmxlTGF5ZXJUb2dnbGVycyA9IHJlcXVpcmUgJy4vZW5hYmxlTGF5ZXJUb2dnbGVycy5jb2ZmZWUnXG5yb3VuZCA9IHJlcXVpcmUoJy4vdXRpbHMuY29mZmVlJykucm91bmRcblJlcG9ydFJlc3VsdHMgPSByZXF1aXJlICcuL3JlcG9ydFJlc3VsdHMuY29mZmVlJ1xudCA9IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnKVxudGVtcGxhdGVzID1cbiAgcmVwb3J0TG9hZGluZzogdFsnbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3JlcG9ydExvYWRpbmcnXVxuSm9iSXRlbSA9IHJlcXVpcmUgJy4vam9iSXRlbS5jb2ZmZWUnXG5Db2xsZWN0aW9uVmlldyA9IHJlcXVpcmUoJ3ZpZXdzL2NvbGxlY3Rpb25WaWV3JylcblxuY2xhc3MgUmVjb3JkU2V0XG5cbiAgY29uc3RydWN0b3I6IChAZGF0YSwgQHRhYiwgQHNrZXRjaENsYXNzSWQpIC0+XG5cbiAgdG9BcnJheTogKCkgLT5cbiAgICBpZiBAc2tldGNoQ2xhc3NJZFxuICAgICAgZGF0YSA9IF8uZmluZCBAZGF0YS52YWx1ZSwgKHYpID0+XG4gICAgICAgIHYuZmVhdHVyZXM/WzBdPy5hdHRyaWJ1dGVzP1snU0NfSUQnXSBpcyBAc2tldGNoQ2xhc3NJZFxuICAgICAgdW5sZXNzIGRhdGFcbiAgICAgICAgdGhyb3cgXCJDb3VsZCBub3QgZmluZCBkYXRhIGZvciBza2V0Y2hDbGFzcyAje0Bza2V0Y2hDbGFzc0lkfVwiXG4gICAgZWxzZVxuICAgICAgaWYgXy5pc0FycmF5IEBkYXRhLnZhbHVlXG4gICAgICAgIGRhdGEgPSBAZGF0YS52YWx1ZVswXVxuICAgICAgZWxzZVxuICAgICAgICBkYXRhID0gQGRhdGEudmFsdWVcbiAgICBfLm1hcCBkYXRhLmZlYXR1cmVzLCAoZmVhdHVyZSkgLT5cbiAgICAgIGZlYXR1cmUuYXR0cmlidXRlc1xuXG4gIHJhdzogKGF0dHIpIC0+XG4gICAgYXR0cnMgPSBfLm1hcCBAdG9BcnJheSgpLCAocm93KSAtPlxuICAgICAgcm93W2F0dHJdXG4gICAgYXR0cnMgPSBfLmZpbHRlciBhdHRycywgKGF0dHIpIC0+IGF0dHIgIT0gdW5kZWZpbmVkXG4gICAgaWYgYXR0cnMubGVuZ3RoIGlzIDBcbiAgICAgIGNvbnNvbGUubG9nIEBkYXRhXG4gICAgICBAdGFiLnJlcG9ydEVycm9yIFwiQ291bGQgbm90IGdldCBhdHRyaWJ1dGUgI3thdHRyfSBmcm9tIHJlc3VsdHNcIlxuICAgICAgdGhyb3cgXCJDb3VsZCBub3QgZ2V0IGF0dHJpYnV0ZSAje2F0dHJ9XCJcbiAgICBlbHNlIGlmIGF0dHJzLmxlbmd0aCBpcyAxXG4gICAgICByZXR1cm4gYXR0cnNbMF1cbiAgICBlbHNlXG4gICAgICByZXR1cm4gYXR0cnNcblxuICBpbnQ6IChhdHRyKSAtPlxuICAgIHJhdyA9IEByYXcoYXR0cilcbiAgICBpZiBfLmlzQXJyYXkocmF3KVxuICAgICAgXy5tYXAgcmF3LCBwYXJzZUludFxuICAgIGVsc2VcbiAgICAgIHBhcnNlSW50KHJhdylcblxuICBmbG9hdDogKGF0dHIsIGRlY2ltYWxQbGFjZXM9MikgLT5cbiAgICByYXcgPSBAcmF3KGF0dHIpXG4gICAgaWYgXy5pc0FycmF5KHJhdylcbiAgICAgIF8ubWFwIHJhdywgKHZhbCkgLT4gcm91bmQodmFsLCBkZWNpbWFsUGxhY2VzKVxuICAgIGVsc2VcbiAgICAgIHJvdW5kKHJhdywgZGVjaW1hbFBsYWNlcylcblxuICBib29sOiAoYXR0cikgLT5cbiAgICByYXcgPSBAcmF3KGF0dHIpXG4gICAgaWYgXy5pc0FycmF5KHJhdylcbiAgICAgIF8ubWFwIHJhdywgKHZhbCkgLT4gdmFsLnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKSBpcyAndHJ1ZSdcbiAgICBlbHNlXG4gICAgICByYXcudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpIGlzICd0cnVlJ1xuXG5jbGFzcyBSZXBvcnRUYWIgZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gIG5hbWU6ICdJbmZvcm1hdGlvbidcbiAgZGVwZW5kZW5jaWVzOiBbXVxuXG4gIGluaXRpYWxpemU6IChAbW9kZWwsIEBvcHRpb25zKSAtPlxuICAgICMgV2lsbCBiZSBpbml0aWFsaXplZCBieSBTZWFTa2V0Y2ggd2l0aCB0aGUgZm9sbG93aW5nIGFyZ3VtZW50czpcbiAgICAjICAgKiBtb2RlbCAtIFRoZSBza2V0Y2ggYmVpbmcgcmVwb3J0ZWQgb25cbiAgICAjICAgKiBvcHRpb25zXG4gICAgIyAgICAgLSAucGFyZW50IC0gdGhlIHBhcmVudCByZXBvcnQgdmlld1xuICAgICMgICAgICAgIGNhbGwgQG9wdGlvbnMucGFyZW50LmRlc3Ryb3koKSB0byBjbG9zZSB0aGUgd2hvbGUgcmVwb3J0IHdpbmRvd1xuICAgIEBhcHAgPSB3aW5kb3cuYXBwXG4gICAgXy5leHRlbmQgQCwgQG9wdGlvbnNcbiAgICBAcmVwb3J0UmVzdWx0cyA9IG5ldyBSZXBvcnRSZXN1bHRzKEBtb2RlbCwgQGRlcGVuZGVuY2llcylcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAnZXJyb3InLCBAcmVwb3J0RXJyb3JcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAnam9icycsIEByZW5kZXJKb2JEZXRhaWxzXG4gICAgQGxpc3RlblRvT25jZSBAcmVwb3J0UmVzdWx0cywgJ2pvYnMnLCBAcmVwb3J0Sm9ic1xuICAgIEBsaXN0ZW5UbyBAcmVwb3J0UmVzdWx0cywgJ2ZpbmlzaGVkJywgXy5iaW5kIEByZW5kZXIsIEBcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAncmVxdWVzdCcsIEByZXBvcnRSZXF1ZXN0ZWRcblxuICByZW5kZXI6ICgpIC0+XG4gICAgdGhyb3cgJ3JlbmRlciBtZXRob2QgbXVzdCBiZSBvdmVyaWRkZW4nXG5cbiAgc2hvdzogKCkgLT5cbiAgICBAJGVsLnNob3coKVxuICAgIEB2aXNpYmxlID0gdHJ1ZVxuICAgIGlmIEBkZXBlbmRlbmNpZXM/Lmxlbmd0aCBhbmQgIUByZXBvcnRSZXN1bHRzLm1vZGVscy5sZW5ndGhcbiAgICAgIEByZXBvcnRSZXN1bHRzLnBvbGwoKVxuICAgIGVsc2UgaWYgIUBkZXBlbmRlbmNpZXM/Lmxlbmd0aFxuICAgICAgQHJlbmRlcigpXG4gICAgICBAJCgnW2RhdGEtYXR0cmlidXRlLXR5cGU9VXJsRmllbGRdIC52YWx1ZSwgW2RhdGEtYXR0cmlidXRlLXR5cGU9VXBsb2FkRmllbGRdIC52YWx1ZScpLmVhY2ggKCkgLT5cbiAgICAgICAgdGV4dCA9ICQoQCkudGV4dCgpXG4gICAgICAgIGh0bWwgPSBbXVxuICAgICAgICBmb3IgdXJsIGluIHRleHQuc3BsaXQoJywnKVxuICAgICAgICAgIGlmIHVybC5sZW5ndGhcbiAgICAgICAgICAgIG5hbWUgPSBfLmxhc3QodXJsLnNwbGl0KCcvJykpXG4gICAgICAgICAgICBodG1sLnB1c2ggXCJcIlwiPGEgdGFyZ2V0PVwiX2JsYW5rXCIgaHJlZj1cIiN7dXJsfVwiPiN7bmFtZX08L2E+XCJcIlwiXG4gICAgICAgICQoQCkuaHRtbCBodG1sLmpvaW4oJywgJylcblxuXG4gIGhpZGU6ICgpIC0+XG4gICAgQCRlbC5oaWRlKClcbiAgICBAdmlzaWJsZSA9IGZhbHNlXG5cbiAgcmVtb3ZlOiAoKSA9PlxuICAgIHdpbmRvdy5jbGVhckludGVydmFsIEBldGFJbnRlcnZhbFxuICAgIEBzdG9wTGlzdGVuaW5nKClcbiAgICBzdXBlcigpXG5cbiAgcmVwb3J0UmVxdWVzdGVkOiAoKSA9PlxuICAgIEAkZWwuaHRtbCB0ZW1wbGF0ZXMucmVwb3J0TG9hZGluZy5yZW5kZXIoe30pXG5cbiAgcmVwb3J0RXJyb3I6IChtc2csIGNhbmNlbGxlZFJlcXVlc3QpID0+XG4gICAgdW5sZXNzIGNhbmNlbGxlZFJlcXVlc3RcbiAgICAgIGlmIG1zZyBpcyAnSk9CX0VSUk9SJ1xuICAgICAgICBAc2hvd0Vycm9yICdFcnJvciB3aXRoIHNwZWNpZmljIGpvYidcbiAgICAgIGVsc2VcbiAgICAgICAgQHNob3dFcnJvciBtc2dcblxuICBzaG93RXJyb3I6IChtc2cpID0+XG4gICAgQCQoJy5wcm9ncmVzcycpLnJlbW92ZSgpXG4gICAgQCQoJ3AuZXJyb3InKS5yZW1vdmUoKVxuICAgIEAkKCdoNCcpLnRleHQoXCJBbiBFcnJvciBPY2N1cnJlZFwiKS5hZnRlciBcIlwiXCJcbiAgICAgIDxwIGNsYXNzPVwiZXJyb3JcIiBzdHlsZT1cInRleHQtYWxpZ246Y2VudGVyO1wiPiN7bXNnfTwvcD5cbiAgICBcIlwiXCJcblxuICByZXBvcnRKb2JzOiAoKSA9PlxuICAgIHVubGVzcyBAbWF4RXRhXG4gICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS53aWR0aCgnMTAwJScpXG4gICAgQCQoJ2g0JykudGV4dCBcIkFuYWx5emluZyBEZXNpZ25zXCJcblxuICBzdGFydEV0YUNvdW50ZG93bjogKCkgPT5cbiAgICBpZiBAbWF4RXRhXG4gICAgICB0b3RhbCA9IChuZXcgRGF0ZShAbWF4RXRhKS5nZXRUaW1lKCkgLSBuZXcgRGF0ZShAZXRhU3RhcnQpLmdldFRpbWUoKSkgLyAxMDAwXG4gICAgICBsZWZ0ID0gKG5ldyBEYXRlKEBtYXhFdGEpLmdldFRpbWUoKSAtIG5ldyBEYXRlKCkuZ2V0VGltZSgpKSAvIDEwMDBcbiAgICAgIF8uZGVsYXkgKCkgPT5cbiAgICAgICAgQHJlcG9ydFJlc3VsdHMucG9sbCgpXG4gICAgICAsIChsZWZ0ICsgMSkgKiAxMDAwXG4gICAgICBfLmRlbGF5ICgpID0+XG4gICAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLmNzcyAndHJhbnNpdGlvbi10aW1pbmctZnVuY3Rpb24nLCAnbGluZWFyJ1xuICAgICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS5jc3MgJ3RyYW5zaXRpb24tZHVyYXRpb24nLCBcIiN7bGVmdCArIDF9c1wiXG4gICAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLndpZHRoKCcxMDAlJylcbiAgICAgICwgNTAwXG5cbiAgcmVuZGVySm9iRGV0YWlsczogKCkgPT5cbiAgICBtYXhFdGEgPSBudWxsXG4gICAgZm9yIGpvYiBpbiBAcmVwb3J0UmVzdWx0cy5tb2RlbHNcbiAgICAgIGlmIGpvYi5nZXQoJ2V0YScpXG4gICAgICAgIGlmICFtYXhFdGEgb3Igam9iLmdldCgnZXRhJykgPiBtYXhFdGFcbiAgICAgICAgICBtYXhFdGEgPSBqb2IuZ2V0KCdldGEnKVxuICAgIGlmIG1heEV0YVxuICAgICAgQG1heEV0YSA9IG1heEV0YVxuICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykud2lkdGgoJzUlJylcbiAgICAgIEBldGFTdGFydCA9IG5ldyBEYXRlKClcbiAgICAgIEBzdGFydEV0YUNvdW50ZG93bigpXG5cbiAgICBAJCgnW3JlbD1kZXRhaWxzXScpLmNzcygnZGlzcGxheScsICdibG9jaycpXG4gICAgQCQoJ1tyZWw9ZGV0YWlsc10nKS5jbGljayAoZSkgPT5cbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgQCQoJ1tyZWw9ZGV0YWlsc10nKS5oaWRlKClcbiAgICAgIEAkKCcuZGV0YWlscycpLnNob3coKVxuICAgIGZvciBqb2IgaW4gQHJlcG9ydFJlc3VsdHMubW9kZWxzXG4gICAgICBpdGVtID0gbmV3IEpvYkl0ZW0oam9iKVxuICAgICAgaXRlbS5yZW5kZXIoKVxuICAgICAgQCQoJy5kZXRhaWxzJykuYXBwZW5kIGl0ZW0uZWxcblxuICBnZXRSZXN1bHQ6IChpZCkgLT5cbiAgICByZXN1bHRzID0gQGdldFJlc3VsdHMoKVxuICAgIHJlc3VsdCA9IF8uZmluZCByZXN1bHRzLCAocikgLT4gci5wYXJhbU5hbWUgaXMgaWRcbiAgICB1bmxlc3MgcmVzdWx0P1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyByZXN1bHQgd2l0aCBpZCAnICsgaWQpXG4gICAgcmVzdWx0LnZhbHVlXG5cbiAgZ2V0Rmlyc3RSZXN1bHQ6IChwYXJhbSwgaWQpIC0+XG4gICAgcmVzdWx0ID0gQGdldFJlc3VsdChwYXJhbSlcbiAgICB0cnlcbiAgICAgIHJldHVybiByZXN1bHRbMF0uZmVhdHVyZXNbMF0uYXR0cmlidXRlc1tpZF1cbiAgICBjYXRjaCBlXG4gICAgICB0aHJvdyBcIkVycm9yIGZpbmRpbmcgI3twYXJhbX06I3tpZH0gaW4gZ3AgcmVzdWx0c1wiXG5cbiAgZ2V0UmVzdWx0czogKCkgLT5cbiAgICByZXN1bHRzID0gQHJlcG9ydFJlc3VsdHMubWFwKChyZXN1bHQpIC0+IHJlc3VsdC5nZXQoJ3Jlc3VsdCcpLnJlc3VsdHMpXG4gICAgdW5sZXNzIHJlc3VsdHM/Lmxlbmd0aFxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBncCByZXN1bHRzJylcbiAgICBfLmZpbHRlciByZXN1bHRzLCAocmVzdWx0KSAtPlxuICAgICAgcmVzdWx0LnBhcmFtTmFtZSBub3QgaW4gWydSZXN1bHRDb2RlJywgJ1Jlc3VsdE1zZyddXG5cbiAgcmVjb3JkU2V0OiAoZGVwZW5kZW5jeSwgcGFyYW1OYW1lLCBza2V0Y2hDbGFzc0lkPWZhbHNlKSAtPlxuICAgIHVubGVzcyBkZXBlbmRlbmN5IGluIEBkZXBlbmRlbmNpZXNcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIlVua25vd24gZGVwZW5kZW5jeSAje2RlcGVuZGVuY3l9XCJcbiAgICBkZXAgPSBAcmVwb3J0UmVzdWx0cy5maW5kIChyKSAtPiByLmdldCgnc2VydmljZU5hbWUnKSBpcyBkZXBlbmRlbmN5XG4gICAgdW5sZXNzIGRlcFxuICAgICAgY29uc29sZS5sb2cgQHJlcG9ydFJlc3VsdHMubW9kZWxzXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJDb3VsZCBub3QgZmluZCByZXN1bHRzIGZvciAje2RlcGVuZGVuY3l9LlwiXG4gICAgcGFyYW0gPSBfLmZpbmQgZGVwLmdldCgncmVzdWx0JykucmVzdWx0cywgKHBhcmFtKSAtPlxuICAgICAgcGFyYW0ucGFyYW1OYW1lIGlzIHBhcmFtTmFtZVxuICAgIHVubGVzcyBwYXJhbVxuICAgICAgY29uc29sZS5sb2cgZGVwLmdldCgnZGF0YScpLnJlc3VsdHNcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIkNvdWxkIG5vdCBmaW5kIHBhcmFtICN7cGFyYW1OYW1lfSBpbiAje2RlcGVuZGVuY3l9XCJcbiAgICBuZXcgUmVjb3JkU2V0KHBhcmFtLCBALCBza2V0Y2hDbGFzc0lkKVxuXG4gIGVuYWJsZVRhYmxlUGFnaW5nOiAoKSAtPlxuICAgIEAkKCdbZGF0YS1wYWdpbmddJykuZWFjaCAoKSAtPlxuICAgICAgJHRhYmxlID0gJChAKVxuICAgICAgcGFnZVNpemUgPSAkdGFibGUuZGF0YSgncGFnaW5nJylcbiAgICAgIHJvd3MgPSAkdGFibGUuZmluZCgndGJvZHkgdHInKS5sZW5ndGhcbiAgICAgIHBhZ2VzID0gTWF0aC5jZWlsKHJvd3MgLyBwYWdlU2l6ZSlcbiAgICAgIGlmIHBhZ2VzID4gMVxuICAgICAgICAkdGFibGUuYXBwZW5kIFwiXCJcIlxuICAgICAgICAgIDx0Zm9vdD5cbiAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgPHRkIGNvbHNwYW49XCIjeyR0YWJsZS5maW5kKCd0aGVhZCB0aCcpLmxlbmd0aH1cIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicGFnaW5hdGlvblwiPlxuICAgICAgICAgICAgICAgICAgPHVsPlxuICAgICAgICAgICAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIj5QcmV2PC9hPjwvbGk+XG4gICAgICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICA8L3Rmb290PlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgdWwgPSAkdGFibGUuZmluZCgndGZvb3QgdWwnKVxuICAgICAgICBmb3IgaSBpbiBfLnJhbmdlKDEsIHBhZ2VzICsgMSlcbiAgICAgICAgICB1bC5hcHBlbmQgXCJcIlwiXG4gICAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIj4je2l9PC9hPjwvbGk+XG4gICAgICAgICAgXCJcIlwiXG4gICAgICAgIHVsLmFwcGVuZCBcIlwiXCJcbiAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIj5OZXh0PC9hPjwvbGk+XG4gICAgICAgIFwiXCJcIlxuICAgICAgICAkdGFibGUuZmluZCgnbGkgYScpLmNsaWNrIChlKSAtPlxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgICAgICRhID0gJCh0aGlzKVxuICAgICAgICAgIHRleHQgPSAkYS50ZXh0KClcbiAgICAgICAgICBpZiB0ZXh0IGlzICdOZXh0J1xuICAgICAgICAgICAgYSA9ICRhLnBhcmVudCgpLnBhcmVudCgpLmZpbmQoJy5hY3RpdmUnKS5uZXh0KCkuZmluZCgnYScpXG4gICAgICAgICAgICB1bmxlc3MgYS50ZXh0KCkgaXMgJ05leHQnXG4gICAgICAgICAgICAgIGEuY2xpY2soKVxuICAgICAgICAgIGVsc2UgaWYgdGV4dCBpcyAnUHJldidcbiAgICAgICAgICAgIGEgPSAkYS5wYXJlbnQoKS5wYXJlbnQoKS5maW5kKCcuYWN0aXZlJykucHJldigpLmZpbmQoJ2EnKVxuICAgICAgICAgICAgdW5sZXNzIGEudGV4dCgpIGlzICdQcmV2J1xuICAgICAgICAgICAgICBhLmNsaWNrKClcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAkYS5wYXJlbnQoKS5wYXJlbnQoKS5maW5kKCcuYWN0aXZlJykucmVtb3ZlQ2xhc3MgJ2FjdGl2ZSdcbiAgICAgICAgICAgICRhLnBhcmVudCgpLmFkZENsYXNzICdhY3RpdmUnXG4gICAgICAgICAgICBuID0gcGFyc2VJbnQodGV4dClcbiAgICAgICAgICAgICR0YWJsZS5maW5kKCd0Ym9keSB0cicpLmhpZGUoKVxuICAgICAgICAgICAgb2Zmc2V0ID0gcGFnZVNpemUgKiAobiAtIDEpXG4gICAgICAgICAgICAkdGFibGUuZmluZChcInRib2R5IHRyXCIpLnNsaWNlKG9mZnNldCwgbipwYWdlU2l6ZSkuc2hvdygpXG4gICAgICAgICQoJHRhYmxlLmZpbmQoJ2xpIGEnKVsxXSkuY2xpY2soKVxuXG4gICAgICBpZiBub1Jvd3NNZXNzYWdlID0gJHRhYmxlLmRhdGEoJ25vLXJvd3MnKVxuICAgICAgICBpZiByb3dzIGlzIDBcbiAgICAgICAgICBwYXJlbnQgPSAkdGFibGUucGFyZW50KClcbiAgICAgICAgICAkdGFibGUucmVtb3ZlKClcbiAgICAgICAgICBwYXJlbnQucmVtb3ZlQ2xhc3MgJ3RhYmxlQ29udGFpbmVyJ1xuICAgICAgICAgIHBhcmVudC5hcHBlbmQgXCI8cD4je25vUm93c01lc3NhZ2V9PC9wPlwiXG5cbiAgZW5hYmxlTGF5ZXJUb2dnbGVyczogKCkgLT5cbiAgICBlbmFibGVMYXllclRvZ2dsZXJzKEAkZWwpXG5cbiAgZ2V0Q2hpbGRyZW46IChza2V0Y2hDbGFzc0lkKSAtPlxuICAgIF8uZmlsdGVyIEBjaGlsZHJlbiwgKGNoaWxkKSAtPiBjaGlsZC5nZXRTa2V0Y2hDbGFzcygpLmlkIGlzIHNrZXRjaENsYXNzSWRcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlcG9ydFRhYlxuIiwibW9kdWxlLmV4cG9ydHMgPVxuICBcbiAgcm91bmQ6IChudW1iZXIsIGRlY2ltYWxQbGFjZXMpIC0+XG4gICAgdW5sZXNzIF8uaXNOdW1iZXIgbnVtYmVyXG4gICAgICBudW1iZXIgPSBwYXJzZUZsb2F0KG51bWJlcilcbiAgICBtdWx0aXBsaWVyID0gTWF0aC5wb3cgMTAsIGRlY2ltYWxQbGFjZXNcbiAgICBNYXRoLnJvdW5kKG51bWJlciAqIG11bHRpcGxpZXIpIC8gbXVsdGlwbGllciIsInRoaXNbXCJUZW1wbGF0ZXNcIl0gPSB0aGlzW1wiVGVtcGxhdGVzXCJdIHx8IHt9O1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9hdHRyaWJ1dGVzL2F0dHJpYnV0ZUl0ZW1cIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPHRyIGRhdGEtYXR0cmlidXRlLWlkPVxcXCJcIik7Xy5iKF8udihfLmYoXCJpZFwiLGMscCwwKSkpO18uYihcIlxcXCIgZGF0YS1hdHRyaWJ1dGUtZXhwb3J0aWQ9XFxcIlwiKTtfLmIoXy52KF8uZihcImV4cG9ydGlkXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiBkYXRhLWF0dHJpYnV0ZS10eXBlPVxcXCJcIik7Xy5iKF8udihfLmYoXCJ0eXBlXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0ZCBjbGFzcz1cXFwibmFtZVxcXCI+XCIpO18uYihfLnYoXy5mKFwibmFtZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGQgY2xhc3M9XFxcInZhbHVlXFxcIj5cIik7Xy5iKF8udihfLmYoXCJmb3JtYXR0ZWRWYWx1ZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC90cj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9hdHRyaWJ1dGVzL2F0dHJpYnV0ZXNUYWJsZVwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8dGFibGUgY2xhc3M9XFxcImF0dHJpYnV0ZXNcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJhdHRyaWJ1dGVzXCIsYyxwLDEpLGMscCwwLDQ0LDgxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXy5ycChcImF0dHJpYnV0ZXMvYXR0cmlidXRlSXRlbVwiLGMscCxcIiAgICBcIikpO30pO2MucG9wKCk7fV8uYihcIjwvdGFibGU+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvZ2VuZXJpY0F0dHJpYnV0ZXNcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7aWYoXy5zKF8uZChcInNrZXRjaENsYXNzLmRlbGV0ZWRcIixjLHAsMSksYyxwLDAsMjQsMjcwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJhbGVydCBhbGVydC13YXJuXFxcIiBzdHlsZT1cXFwibWFyZ2luLWJvdHRvbToxMHB4O1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBUaGlzIHNrZXRjaCB3YXMgY3JlYXRlZCB1c2luZyB0aGUgXFxcIlwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCJcXFwiIHRlbXBsYXRlLCB3aGljaCBpc1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgbm8gbG9uZ2VyIGF2YWlsYWJsZS4gWW91IHdpbGwgbm90IGJlIGFibGUgdG8gY29weSB0aGlzIHNrZXRjaCBvciBtYWtlIG5ld1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgc2tldGNoZXMgb2YgdGhpcyB0eXBlLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+XCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIiBBdHRyaWJ1dGVzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXy5ycChcImF0dHJpYnV0ZXMvYXR0cmlidXRlc1RhYmxlXCIsYyxwLFwiICAgIFwiKSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wibm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3JlcG9ydExvYWRpbmdcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0TG9hZGluZ1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8IS0tIDxkaXYgY2xhc3M9XFxcInNwaW5uZXJcXFwiPjM8L2Rpdj4gLS0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+UmVxdWVzdGluZyBSZXBvcnQgZnJvbSBTZXJ2ZXI8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGRpdiBjbGFzcz1cXFwicHJvZ3Jlc3MgcHJvZ3Jlc3Mtc3RyaXBlZCBhY3RpdmVcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJiYXJcXFwiIHN0eWxlPVxcXCJ3aWR0aDogMTAwJTtcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8YSBocmVmPVxcXCIjXFxcIiByZWw9XFxcImRldGFpbHNcXFwiPmRldGFpbHM8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcImRldGFpbHNcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xuXG5pZih0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gdGhpc1tcIlRlbXBsYXRlc1wiXTtcbn0iLCJSZXBvcnRUYWIgPSByZXF1aXJlICdyZXBvcnRUYWInXG50ZW1wbGF0ZXMgPSByZXF1aXJlICcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuaWRzID0gcmVxdWlyZSAnLi9pZHMuY29mZmVlJ1xuZm9yIGtleSwgdmFsdWUgb2YgaWRzXG4gIHdpbmRvd1trZXldID0gdmFsdWVcblxuXG5cbmNsYXNzIEFycmF5RmlzaGluZ1ZhbHVlVGFiIGV4dGVuZHMgUmVwb3J0VGFiXG4gIG5hbWU6ICdGaXNoaW5nIFZhbHVlJ1xuICBjbGFzc05hbWU6ICdmaXNoaW5nVmFsdWUnXG4gIHRlbXBsYXRlOiB0ZW1wbGF0ZXMuYXJyYXlGaXNoaW5nVmFsdWVcbiAgZGVwZW5kZW5jaWVzOiBbJ0Zpc2hpbmdWYWx1ZSddXG4gIHRpbWVvdXQ6IDI0MDAwMFxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICBzYW5jdHVhcmllcyA9IEBnZXRDaGlsZHJlbiBTQU5DVFVBUllfSURcbiAgICBpZiBzYW5jdHVhcmllcy5sZW5ndGhcbiAgICAgIHNhbmN0dWFyeVBlcmNlbnQgPSBAcmVjb3JkU2V0KFxuICAgICAgICAnRmlzaGluZ1ZhbHVlJywgXG4gICAgICAgICdGaXNoaW5nVmFsdWUnLCBcbiAgICAgICAgU0FOQ1RVQVJZX0lEXG4gICAgICApLmZsb2F0KCdQRVJDRU5UJywgMClcblxuICAgIGFxdWFjdWx0dXJlQXJlYXMgPSBAZ2V0Q2hpbGRyZW4gQVFVQUNVTFRVUkVfSURcbiAgICBpZiBhcXVhY3VsdHVyZUFyZWFzLmxlbmd0aFxuICAgICAgYXF1YWN1bHR1cmVQZXJjZW50ID0gQHJlY29yZFNldChcbiAgICAgICAgJ0Zpc2hpbmdWYWx1ZScsIFxuICAgICAgICAnRmlzaGluZ1ZhbHVlJywgXG4gICAgICAgIEFRVUFDVUxUVVJFX0lEXG4gICAgICApLmZsb2F0KCdQRVJDRU5UJywgMClcblxuICAgIG1vb3JpbmdzID0gQGdldENoaWxkcmVuIE1PT1JJTkdfSURcbiAgICBpZiBtb29yaW5ncy5sZW5ndGhcbiAgICAgIG1vb3JpbmdQZXJjZW50ID0gQHJlY29yZFNldChcbiAgICAgICAgJ0Zpc2hpbmdWYWx1ZScsIFxuICAgICAgICAnRmlzaGluZ1ZhbHVlJywgXG4gICAgICAgIE1PT1JJTkdfSURcbiAgICAgICkuZmxvYXQoJ1BFUkNFTlQnLCAyKVxuXG4gICAgZmlzaGluZ0FyZWFzID0gQGdldENoaWxkcmVuIEZJU0hJTkdfUFJJT1JJVFlfQVJFQV9JRFxuICAgIGlmIGZpc2hpbmdBcmVhcy5sZW5ndGhcbiAgICAgIGZpc2hpbmdBcmVhUGVyY2VudCA9IEByZWNvcmRTZXQoXG4gICAgICAgICdGaXNoaW5nUHJpb3JpdHlBcmVhJywgXG4gICAgICAgICdGaXNoaW5nUHJpb3JpdHlBcmVhJywgXG4gICAgICAgIEZJU0hJTkdfUFJJT1JJVFlfQVJFQV9JRFxuICAgICAgKS5mbG9hdCgnUEVSQ0VOVCcsIDApXG5cbiAgICBub05ldFpvbmVzID0gQGdldENoaWxkcmVuIE5PX05FVF9aT05FU19JRFxuICAgIGlmIG5vTmV0Wm9uZXMubGVuZ3RoXG4gICAgICBub05ldFpvbmVzUGVyY2VudCA9IEByZWNvcmRTZXQoXG4gICAgICAgICdGaXNoaW5nVmFsdWUnLCBcbiAgICAgICAgJ0Zpc2hpbmdWYWx1ZScsIFxuICAgICAgICBOT19ORVRfWk9ORVNfSURcbiAgICAgICkuZmxvYXQoJ1BFUkNFTlQnLCAwKVxuXG4gICAgY29udGV4dCA9XG4gICAgICBza2V0Y2g6IEBtb2RlbC5mb3JUZW1wbGF0ZSgpXG4gICAgICBza2V0Y2hDbGFzczogQHNrZXRjaENsYXNzLmZvclRlbXBsYXRlKClcbiAgICAgIGF0dHJpYnV0ZXM6IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKClcbiAgICAgIGFkbWluOiBAcHJvamVjdC5pc0FkbWluIHdpbmRvdy51c2VyXG4gICAgICBzYW5jdHVhcnlQZXJjZW50OiBzYW5jdHVhcnlQZXJjZW50XG4gICAgICBudW1TYW5jdHVhcmllczogc2FuY3R1YXJpZXMubGVuZ3RoXG4gICAgICBzYW5jdHVhcmllczogc2FuY3R1YXJpZXMubGVuZ3RoID4gMFxuICAgICAgc2FuY1BsdXJhbDogc2FuY3R1YXJpZXMubGVuZ3RoID4gMVxuICAgICAgbW9vcmluZ0FyZWFQZXJjZW50OiBtb29yaW5nUGVyY2VudFxuICAgICAgbnVtTW9vcmluZ3M6IG1vb3JpbmdzLmxlbmd0aFxuICAgICAgbW9vcmluZ3M6IG1vb3JpbmdzLmxlbmd0aCA+IDBcbiAgICAgIG1vb3JpbmdzUGx1cmFsOiBtb29yaW5ncy5sZW5ndGggPiAxXG4gICAgICBmaXNoaW5nQXJlYVBlcmNlbnQ6IGZpc2hpbmdBcmVhUGVyY2VudFxuICAgICAgbnVtRmlzaGluZ0FyZWFzOiBmaXNoaW5nQXJlYXMubGVuZ3RoXG4gICAgICBmaXNoaW5nQXJlYXM6IGZpc2hpbmdBcmVhcy5sZW5ndGggPiAwXG4gICAgICBmaXNoaW5nQXJlYXNQbHVyYWw6IGZpc2hpbmdBcmVhcy5sZW5ndGggPiAxXG5cbiAgICAgIGFxdWFjdWx0dXJlQXJlYVBlcmNlbnQ6IGFxdWFjdWx0dXJlUGVyY2VudFxuICAgICAgbnVtQXF1YWN1bHR1cmVBcmVhczogYXF1YWN1bHR1cmVBcmVhcy5sZW5ndGhcbiAgICAgIGFxdWFjdWx0dXJlQXJlYXM6IGFxdWFjdWx0dXJlQXJlYXMubGVuZ3RoID4gMFxuICAgICAgYXF1YWN1bHR1cmVBcmVhc1BsdXJhbDogYXF1YWN1bHR1cmVBcmVhcy5sZW5ndGggPiAxXG5cbiAgICAgIG5vTmV0Wm9uZXNQZXJjZW50OiBub05ldFpvbmVzUGVyY2VudFxuICAgICAgbnVtTm9OZXRab25lczogbm9OZXRab25lcy5sZW5ndGhcbiAgICAgIGhhc05vTmV0Wm9uZXM6IG5vTmV0Wm9uZXMubGVuZ3RoID4gMFxuICAgICAgbm9OZXRab25lc1BsdXJhbDogbm9OZXRab25lcy5sZW5ndGggPiAxXG5cbiAgICBAJGVsLmh0bWwgQHRlbXBsYXRlLnJlbmRlcihjb250ZXh0LCB0ZW1wbGF0ZXMpXG4gICAgQGVuYWJsZUxheWVyVG9nZ2xlcnMoQCRlbClcblxuXG5tb2R1bGUuZXhwb3J0cyA9IEFycmF5RmlzaGluZ1ZhbHVlVGFiIiwiUmVwb3J0VGFiID0gcmVxdWlyZSAncmVwb3J0VGFiJ1xudGVtcGxhdGVzID0gcmVxdWlyZSAnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcbmlkcyA9IHJlcXVpcmUgJy4vaWRzLmNvZmZlZSdcbmZvciBrZXksIHZhbHVlIG9mIGlkc1xuICB3aW5kb3dba2V5XSA9IHZhbHVlXG5cbmNsYXNzIEFycmF5SGFiaXRhdFRhYiBleHRlbmRzIFJlcG9ydFRhYlxuICBuYW1lOiAnSGFiaXRhdCdcbiAgY2xhc3NOYW1lOiAnaGFiaXRhdCdcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5hcnJheUhhYml0YXRzXG4gIGRlcGVuZGVuY2llczogWydCYXJidWRhSGFiaXRhdCddXG4gIHRpbWVvdXQ6IDI0MDAwMFxuICBcbiAgcmVuZGVyOiAoKSAtPlxuICAgIHNhbmN0dWFyaWVzID0gQGdldENoaWxkcmVuIFNBTkNUVUFSWV9JRFxuICAgIGlmIHNhbmN0dWFyaWVzLmxlbmd0aFxuICAgICAgc2FuY3R1YXJ5ID0gQHJlY29yZFNldCgnQmFyYnVkYUhhYml0YXQnLCAnSGFiaXRhdHMnLCBTQU5DVFVBUllfSUQpXG4gICAgICAgIC50b0FycmF5KClcbiAgICAgIGZvciByb3cgaW4gc2FuY3R1YXJ5XG4gICAgICAgIGlmIHBhcnNlRmxvYXQocm93LlBlcmNlbnQpID49IDMzXG4gICAgICAgICAgcm93Lm1lZXRzR29hbCA9IHRydWVcblxuICAgIGFxdWFjdWx0dXJlQXJlYXMgPSBAZ2V0Q2hpbGRyZW4gQVFVQUNVTFRVUkVfSURcbiAgICBpZiBhcXVhY3VsdHVyZUFyZWFzLmxlbmd0aFxuICAgICAgYXF1YWN1bHR1cmUgPSBAcmVjb3JkU2V0KCdCYXJidWRhSGFiaXRhdCcsICdIYWJpdGF0cycsIEFRVUFDVUxUVVJFX0lEKVxuICAgICAgICAudG9BcnJheSgpXG5cbiAgICBtb29yaW5ncyA9IEBnZXRDaGlsZHJlbiBNT09SSU5HX0lEXG4gICAgaWYgbW9vcmluZ3MubGVuZ3RoXG4gICAgICBtb29yaW5nRGF0YSA9IEByZWNvcmRTZXQoJ0JhcmJ1ZGFIYWJpdGF0JywgJ0hhYml0YXRzJywgTU9PUklOR19JRClcbiAgICAgICAgLnRvQXJyYXkoKVxuXG4gICAgZmlzaGluZ0FyZWFzID0gQGdldENoaWxkcmVuIEZJU0hJTkdfUFJJT1JJVFlfQVJFQV9JRFxuICAgIGlmIGZpc2hpbmdBcmVhcy5sZW5ndGhcbiAgICAgIGZpc2hpbmdBcmVhRGF0YSA9IEByZWNvcmRTZXQoJ0JhcmJ1ZGFIYWJpdGF0JywgJ0hhYml0YXRzJywgXG4gICAgICAgIEZJU0hJTkdfUFJJT1JJVFlfQVJFQV9JRCkudG9BcnJheSgpXG5cbiAgICBub05ldFpvbmVzID0gQGdldENoaWxkcmVuIE5PX05FVF9aT05FU19JRFxuICAgIGlmIG5vTmV0Wm9uZXMubGVuZ3RoXG4gICAgICBub05ldFpvbmVzRGF0YSA9IEByZWNvcmRTZXQoJ0JhcmJ1ZGFIYWJpdGF0JywgJ0hhYml0YXRzJywgXG4gICAgICAgIE5PX05FVF9aT05FU19JRCkudG9BcnJheSgpXG5cbiAgICBjb250ZXh0ID1cbiAgICAgIHNrZXRjaDogQG1vZGVsLmZvclRlbXBsYXRlKClcbiAgICAgIHNrZXRjaENsYXNzOiBAc2tldGNoQ2xhc3MuZm9yVGVtcGxhdGUoKVxuICAgICAgYXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKVxuICAgICAgYWRtaW46IEBwcm9qZWN0LmlzQWRtaW4gd2luZG93LnVzZXJcbiAgICAgIG51bVNhbmN0dWFyaWVzOiBzYW5jdHVhcmllcy5sZW5ndGhcbiAgICAgIHNhbmN0dWFyaWVzOiBzYW5jdHVhcmllcy5sZW5ndGggPiAwXG4gICAgICBzYW5jdHVhcnlIYWJpdGF0OiBzYW5jdHVhcnlcbiAgICAgIHNhbmN0dWFyeVBsdXJhbDogc2FuY3R1YXJpZXMubGVuZ3RoID4gMVxuICAgICAgbnVtQXF1YWN1bHR1cmU6IGFxdWFjdWx0dXJlQXJlYXMubGVuZ3RoXG4gICAgICBhcXVhY3VsdHVyZUFyZWFzOiBhcXVhY3VsdHVyZUFyZWFzLmxlbmd0aCA+IDBcbiAgICAgIGFxdWFQbHVyYWw6IGFxdWFjdWx0dXJlQXJlYXMubGVuZ3RoID4gMVxuICAgICAgYXF1YWN1bHR1cmVIYWJpdGF0OiBhcXVhY3VsdHVyZVxuICAgICAgbW9vcmluZ3M6IG1vb3JpbmdzLmxlbmd0aCA+IDBcbiAgICAgIG51bU1vb3JpbmdzOiBtb29yaW5ncy5sZW5ndGhcbiAgICAgIG1vb3JpbmdEYXRhOiBtb29yaW5nRGF0YVxuICAgICAgbW9vcmluZ1BsdXJhbDogbW9vcmluZ3MubGVuZ3RoID4gMVxuXG4gICAgICBmaXNoaW5nQXJlYXM6IGZpc2hpbmdBcmVhcy5sZW5ndGggPiAwXG4gICAgICBudW1GaXNoaW5nQXJlYXM6IGZpc2hpbmdBcmVhcy5sZW5ndGhcbiAgICAgIGZpc2hpbmdBcmVhRGF0YTogZmlzaGluZ0FyZWFEYXRhXG4gICAgICBmaXNoaW5nQXJlYVBsdXJhbDogZmlzaGluZ0FyZWFzLmxlbmd0aCA+IDFcblxuICAgICAgaGFzTm9OZXRab25lczogbm9OZXRab25lcy5sZW5ndGggPiAwXG4gICAgICBudW1Ob05ldFpvbmVzOiBub05ldFpvbmVzLmxlbmd0aFxuICAgICAgbm9OZXRab25lc0RhdGE6IG5vTmV0Wm9uZXNEYXRhXG4gICAgICBub05ldFpvbmVzUGx1cmFsOiBub05ldFpvbmVzLmxlbmd0aCA+IDFcblxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHRlbXBsYXRlcylcbiAgICBAZW5hYmxlTGF5ZXJUb2dnbGVycyhAJGVsKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEFycmF5SGFiaXRhdFRhYiIsIlJlcG9ydFRhYiA9IHJlcXVpcmUgJ3JlcG9ydFRhYidcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5pZHMgPSByZXF1aXJlICcuL2lkcy5jb2ZmZWUnXG5mb3Iga2V5LCB2YWx1ZSBvZiBpZHNcbiAgd2luZG93W2tleV0gPSB2YWx1ZVxuXG5yb3VuZCA9IHJlcXVpcmUoJ2FwaS91dGlscycpLnJvdW5kXG5UT1RBTF9BUkVBID0gMTY0LjggIyBzcSBtaWxlc1xuVE9UQUxfTEFHT09OX0FSRUEgPSAxMS4xXG5fcGFydGlhbHMgPSByZXF1aXJlICdhcGkvdGVtcGxhdGVzJ1xucGFydGlhbHMgPSBbXVxuZm9yIGtleSwgdmFsIG9mIF9wYXJ0aWFsc1xuICBwYXJ0aWFsc1trZXkucmVwbGFjZSgnbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpLycsICcnKV0gPSB2YWxcblxuY2xhc3MgQXJyYXlPdmVydmlld1RhYiBleHRlbmRzIFJlcG9ydFRhYlxuICBuYW1lOiAnT3ZlcnZpZXcnXG4gIGNsYXNzTmFtZTogJ292ZXJ2aWV3J1xuICB0ZW1wbGF0ZTogdGVtcGxhdGVzLmFycmF5T3ZlcnZpZXdcbiAgZGVwZW5kZW5jaWVzOiBbJ0RpYW1ldGVyJ11cbiAgdGltZW91dDogMTIwMDAwXG5cbiAgcmVuZGVyOiAoKSAtPlxuICAgICNPQ0VBTl9BUkVBID0gQHJlY29yZFNldCgnRGlhbWV0ZXInLCAnRGlhbWV0ZXInKS5mbG9hdCgnT0NFQU5fQVJFQScpXG4gICAgI0xBR09PTl9BUkVBID0gQHJlY29yZFNldCgnRGlhbWV0ZXInLCAnRGlhbWV0ZXInKS5mbG9hdCgnTEFHT09OX0FSRUEnKVxuICAgICNPQ0VBTl9QRVJDRU5UID0gKE9DRUFOX0FSRUEgLyBUT1RBTF9BUkVBKSAqIDEwMC4wXG4gICAgI0xBR09PTl9QRVJDRU5UID0gKExBR09PTl9BUkVBIC8gVE9UQUxfTEFHT09OX0FSRUEpICogMTAwLjBcbiAgICBzYW5jdHVhcmllcyA9IFtdXG4gICAgYXF1YWN1bHR1cmVBcmVhcyA9IFtdXG4gICAgbW9vcmluZ3MgPSBbXVxuICAgIG5vTmV0Wm9uZXMgPSBbXVxuICAgIGZpc2hpbmdBcmVhcyA9IFtdXG5cbiAgICBzYW5jdHVhcmllcyA9IF8uZmlsdGVyIEBjaGlsZHJlbiwgKGMpIC0+IFxuICAgICAgYy5nZXQoJ3NrZXRjaGNsYXNzJykgaXMgU0FOQ1RVQVJZX0lEXG4gICAgbnVtU2FuY3R1YXJpZXMgPSBzYW5jdHVhcmllcy5sZW5ndGhcbiAgICBpZiBudW1TYW5jdHVhcmllcyA+IDBcbiAgICAgIHNhbmN0dWFyeU9jZWFuQXJlYSA9IEByZWNvcmRTZXQoXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgU0FOQ1RVQVJZX0lEXG4gICAgICApLmZsb2F0KCdPQ0VBTl9BUkVBJywgMSlcbiAgICAgIHNhbmN0dWFyeUxhZ29vbkFyZWEgPSBAcmVjb3JkU2V0KFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgIFNBTkNUVUFSWV9JRFxuICAgICAgKS5mbG9hdCgnTEFHT09OX0FSRUEnLCAxKVxuICAgICAgc2FuY3R1YXJ5T2NlYW5QZXJjZW50ID0gQHJlY29yZFNldChcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICBTQU5DVFVBUllfSURcbiAgICAgICkuZmxvYXQoJ09DRUFOX1BFUkNFTlQnLCAxKVxuICAgICAgc2FuY3R1YXJ5TGFnb29uUGVyY2VudCA9IEByZWNvcmRTZXQoXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgU0FOQ1RVQVJZX0lEXG4gICAgICApLmZsb2F0KCdMQUdPT05fUEVSQ0VOVCcsIDEpXG4gICAgZWxzZVxuICAgICAgc2FuY3R1YXJ5T2NlYW5BcmVhID0gMFxuICAgICAgc2FuY3R1YXJ5T2NlYW5QZXJjZW50ID0gMC4wXG4gICAgICBzYW5jdHVhcnlMYWdvb25BcmVhID0gMFxuICAgICAgc2FuY3R1YXJ5TGFnb29uUGVyY2VudCA9IDAuMFxuXG4gICAgYXF1YWN1bHR1cmVBcmVhcyA9IF8uZmlsdGVyIEBjaGlsZHJlbiwgKGMpIC0+IFxuICAgICAgYy5nZXQoJ3NrZXRjaGNsYXNzJykgaXMgQVFVQUNVTFRVUkVfSURcbiAgICBudW1BcXVhY3VsdHVyZUFyZWFzID0gYXF1YWN1bHR1cmVBcmVhcy5sZW5ndGhcbiAgICBpZiBudW1BcXVhY3VsdHVyZUFyZWFzID4gMFxuICAgICAgYXF1YWN1bHR1cmVPY2VhbkFyZWEgPSBAcmVjb3JkU2V0KFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgIEFRVUFDVUxUVVJFX0lEXG4gICAgICApLmZsb2F0KCdPQ0VBTl9BUkVBJywgMSlcbiAgICAgIGFxdWFjdWx0dXJlTGFnb29uQXJlYSA9IEByZWNvcmRTZXQoXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgQVFVQUNVTFRVUkVfSURcbiAgICAgICkuZmxvYXQoJ0xBR09PTl9BUkVBJywgMSlcbiAgICAgIGFxdWFjdWx0dXJlT2NlYW5QZXJjZW50ID0gQHJlY29yZFNldChcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICBBUVVBQ1VMVFVSRV9JRFxuICAgICAgKS5mbG9hdCgnT0NFQU5fUEVSQ0VOVCcsIDEpXG4gICAgICBhcXVhY3VsdHVyZUxhZ29vblBlcmNlbnQgPSBAcmVjb3JkU2V0KFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgIEFRVUFDVUxUVVJFX0lEXG4gICAgICApLmZsb2F0KCdMQUdPT05fUEVSQ0VOVCcsIDEpXG4gICAgZWxzZVxuICAgICAgYXF1YWN1bHR1cmVPY2VhbkFyZWEgPSAwXG4gICAgICBhcXVhY3VsdHVyZU9jZWFuUGVyY2VudCA9IDAuMFxuICAgICAgYXF1YWN1bHR1cmVMYWdvb25BcmVhID0gMFxuICAgICAgYXF1YWN1bHR1cmVMYWdvb25QZXJjZW50ID0gMC4wXG5cbiAgICBtb29yaW5ncyA9ICBfLmZpbHRlciBAY2hpbGRyZW4sIChjKSAtPiBcbiAgICAgIGMuZ2V0KCdza2V0Y2hjbGFzcycpIGlzIE1PT1JJTkdfSURcbiAgICBudW1Nb29yaW5ncyA9IG1vb3JpbmdzLmxlbmd0aFxuICAgIGlmIG51bU1vb3JpbmdzID4gMFxuICAgICAgbW9vcmluZ3NPY2VhbkFyZWEgPSBAcmVjb3JkU2V0KFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgIE1PT1JJTkdfSURcbiAgICAgICkuZmxvYXQoJ09DRUFOX0FSRUEnLCAxKVxuICAgICAgbW9vcmluZ3NMYWdvb25BcmVhID0gQHJlY29yZFNldChcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICBNT09SSU5HX0lEXG4gICAgICApLmZsb2F0KCdMQUdPT05fQVJFQScsIDEpXG4gICAgICBtb29yaW5nc09jZWFuUGVyY2VudCA9IEByZWNvcmRTZXQoXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgTU9PUklOR19JRFxuICAgICAgKS5mbG9hdCgnT0NFQU5fUEVSQ0VOVCcsIDEpXG4gICAgICBtb29yaW5nc0xhZ29vblBlcmNlbnQgPSBAcmVjb3JkU2V0KFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgIE1PT1JJTkdfSURcbiAgICAgICkuZmxvYXQoJ0xBR09PTl9QRVJDRU5UJywgMSlcbiAgICBlbHNlXG4gICAgICBtb29yaW5nc09jZWFuQXJlYSA9IDBcbiAgICAgIG1vb3JpbmdzT2NlYW5QZXJjZW50ID0gMC4wXG4gICAgICBtb29yaW5nc0xhZ29vbkFyZWEgPSAwXG4gICAgICBtb29yaW5nc0xhZ29vblBlcmNlbnQgPSAwLjBcblxuICAgIG5vTmV0Wm9uZXMgPSBfLmZpbHRlciBAY2hpbGRyZW4sIChjKSAtPiBcbiAgICAgIGMuZ2V0KCdza2V0Y2hjbGFzcycpIGlzIE5PX05FVF9aT05FU19JRFxuICAgIG51bU5vTmV0Wm9uZXMgPSBub05ldFpvbmVzLmxlbmd0aFxuICAgIGlmIG51bU5vTmV0Wm9uZXMgPiAwXG4gICAgICBub05ldFpvbmVzT2NlYW5BcmVhID0gQHJlY29yZFNldChcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICBOT19ORVRfWk9ORVNfSURcbiAgICAgICkuZmxvYXQoJ09DRUFOX0FSRUEnLCAxKVxuICAgICAgbm9OZXRab25lc0xhZ29vbkFyZWEgPSBAcmVjb3JkU2V0KFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgIE5PX05FVF9aT05FU19JRFxuICAgICAgKS5mbG9hdCgnTEFHT09OX0FSRUEnLCAxKSBcbiAgICAgIG5vTmV0Wm9uZXNPY2VhblBlcmNlbnQgPSBAcmVjb3JkU2V0KFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgIE5PX05FVF9aT05FU19JRFxuICAgICAgKS5mbG9hdCgnT0NFQU5fUEVSQ0VOVCcsIDEpXG4gICAgICBub05ldFpvbmVzTGFnb29uUGVyY2VudCA9IEByZWNvcmRTZXQoXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgTk9fTkVUX1pPTkVTX0lEXG4gICAgICApLmZsb2F0KCdMQUdPT05fUEVSQ0VOVCcsIDEpIFxuICAgIGVsc2VcbiAgICAgIG5vTmV0Wm9uZXNPY2VhbkFyZWEgPSAwXG4gICAgICBub05ldFpvbmVzT2NlYW5QZXJjZW50ID0gMC4wXG4gICAgICBub05ldFpvbmVzTGFnb29uQXJlYSA9IDBcbiAgICAgIG5vTmV0Wm9uZXNMYWdvb25QZXJjZW50ID0gMC4wXG5cbiAgICBmaXNoaW5nQXJlYXMgPSBfLmZpbHRlciBAY2hpbGRyZW4sIChjKSAtPiBcbiAgICAgIGMuZ2V0KCdza2V0Y2hjbGFzcycpIGlzIEZJU0hJTkdfUFJJT1JJVFlfQVJFQV9JRFxuXG4gICAgbnVtRmlzaGluZ0FyZWFzID0gZmlzaGluZ0FyZWFzLmxlbmd0aFxuICAgIGlmIG51bUZpc2hpbmdBcmVhcyA+IDBcbiAgICAgIGZpc2hpbmdBcmVhc09jZWFuQXJlYSA9IEByZWNvcmRTZXQoXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgRklTSElOR19QUklPUklUWV9BUkVBX0lEXG4gICAgICApLmZsb2F0KCdPQ0VBTl9BUkVBJywgMClcbiAgICAgIGZpc2hpbmdBcmVhc0xhZ29vbkFyZWEgPSBAcmVjb3JkU2V0KFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgIEZJU0hJTkdfUFJJT1JJVFlfQVJFQV9JRFxuICAgICAgKS5mbG9hdCgnTEFHT09OX0FSRUEnLCAwKVxuICAgICAgZmlzaGluZ0FyZWFzT2NlYW5QZXJjZW50ID0gQHJlY29yZFNldChcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICBGSVNISU5HX1BSSU9SSVRZX0FSRUFfSURcbiAgICAgICkuZmxvYXQoJ09DRUFOX1BFUkNFTlQnLCAwKVxuICAgICAgZmlzaGluZ0FyZWFzTGFnb29uUGVyY2VudCA9IEByZWNvcmRTZXQoXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgRklTSElOR19QUklPUklUWV9BUkVBX0lEXG4gICAgICApLmZsb2F0KCdMQUdPT05fUEVSQ0VOVCcsIDApXG4gICAgZWxzZVxuICAgICAgZmlzaGluZ0FyZWFzT2NlYW5BcmVhID0gMFxuICAgICAgZmlzaGluZ0FyZWFzT2NlYW5QZXJjZW50ID0gMC4wXG4gICAgICBmaXNoaW5nQXJlYXNMYWdvb25BcmVhID0gMFxuICAgICAgZmlzaGluZ0FyZWFzTGFnb29uUGVyY2VudCA9IDAuMFxuXG4gICAgbnVtVG90YWxab25lcyA9IG51bVNhbmN0dWFyaWVzK251bU5vTmV0Wm9uZXMrbnVtQXF1YWN1bHR1cmVBcmVhcytudW1Nb29yaW5ncytudW1GaXNoaW5nQXJlYXNcbiAgICBzdW1PY2VhbkFyZWEgPSBzYW5jdHVhcnlPY2VhbkFyZWErbm9OZXRab25lc09jZWFuQXJlYSthcXVhY3VsdHVyZU9jZWFuQXJlYSttb29yaW5nc09jZWFuQXJlYStmaXNoaW5nQXJlYXNPY2VhbkFyZWFcbiAgICBzdW1PY2VhblBlcmNlbnQgPSBzYW5jdHVhcnlPY2VhblBlcmNlbnQrbm9OZXRab25lc09jZWFuUGVyY2VudCthcXVhY3VsdHVyZU9jZWFuUGVyY2VudCttb29yaW5nc09jZWFuUGVyY2VudCtmaXNoaW5nQXJlYXNPY2VhblBlcmNlbnRcbiAgICBzdW1MYWdvb25BcmVhID0gc2FuY3R1YXJ5TGFnb29uQXJlYStub05ldFpvbmVzTGFnb29uQXJlYSthcXVhY3VsdHVyZUxhZ29vbkFyZWErbW9vcmluZ3NMYWdvb25BcmVhK2Zpc2hpbmdBcmVhc0xhZ29vbkFyZWFcbiAgICBzdW1MYWdvb25QZXJjZW50ID0gc2FuY3R1YXJ5TGFnb29uUGVyY2VudCtub05ldFpvbmVzTGFnb29uUGVyY2VudCthcXVhY3VsdHVyZUxhZ29vblBlcmNlbnQrbW9vcmluZ3NMYWdvb25QZXJjZW50K2Zpc2hpbmdBcmVhc0xhZ29vblBlcmNlbnRcbiAgICBoYXNTa2V0Y2hlcyA9IG51bVRvdGFsWm9uZXMgPiAwXG5cbiAgICBjb250ZXh0ID1cbiAgICAgIHNrZXRjaDogQG1vZGVsLmZvclRlbXBsYXRlKClcbiAgICAgIHNrZXRjaENsYXNzOiBAc2tldGNoQ2xhc3MuZm9yVGVtcGxhdGUoKVxuICAgICAgYXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKVxuICAgICAgYW55QXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKS5sZW5ndGggPiAwXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuXG4gICAgICBudW1TYW5jdHVhcmllczogc2FuY3R1YXJpZXMubGVuZ3RoXG4gICAgICBoYXNTYW5jdHVhcmllczogc2FuY3R1YXJpZXMubGVuZ3RoID4gMFxuICAgICAgc2FuY3R1YXJpZXNQbHVyYWw6IHNhbmN0dWFyaWVzLmxlbmd0aCA+IDFcbiAgICAgIHNhbmN0dWFyeU9jZWFuUGVyY2VudDogcm91bmQoc2FuY3R1YXJ5T2NlYW5QZXJjZW50LCAyKVxuICAgICAgc2FuY3R1YXJ5T2NlYW5BcmVhOiByb3VuZChzYW5jdHVhcnlPY2VhbkFyZWEsIDEpXG4gICAgICBzYW5jdHVhcnlMYWdvb25BcmVhOiByb3VuZChzYW5jdHVhcnlMYWdvb25BcmVhLCAyKVxuICAgICAgc2FuY3R1YXJ5TGFnb29uUGVyY2VudDogcm91bmQoc2FuY3R1YXJ5TGFnb29uUGVyY2VudCwgMSlcbiAgICAgIFxuICAgICAgbnVtTm9OZXRab25lczogbm9OZXRab25lcy5sZW5ndGhcbiAgICAgIGhhc05vTmV0Wm9uZXM6IG5vTmV0Wm9uZXMubGVuZ3RoID4gMFxuICAgICAgbm9OZXRab25lc1BsdXJhbDogbm9OZXRab25lcy5sZW5ndGggPiAxXG4gICAgICBub05ldFpvbmVzT2NlYW5QZXJjZW50OiByb3VuZChub05ldFpvbmVzT2NlYW5QZXJjZW50LCAyKVxuICAgICAgbm9OZXRab25lc09jZWFuQXJlYTogcm91bmQobm9OZXRab25lc09jZWFuQXJlYSwgMSlcbiAgICAgIG5vTmV0Wm9uZXNMYWdvb25BcmVhOiByb3VuZChub05ldFpvbmVzTGFnb29uQXJlYSwgMilcbiAgICAgIG5vTmV0Wm9uZXNMYWdvb25QZXJjZW50OiByb3VuZChub05ldFpvbmVzTGFnb29uUGVyY2VudCwgMSlcblxuICAgICAgbnVtQXF1YWN1bHR1cmU6IGFxdWFjdWx0dXJlQXJlYXMubGVuZ3RoXG4gICAgICBoYXNBcXVhY3VsdHVyZTogYXF1YWN1bHR1cmVBcmVhcy5sZW5ndGggPiAwXG4gICAgICBhcXVhY3VsdHVyZVBsdXJhbDogYXF1YWN1bHR1cmVBcmVhcy5sZW5ndGggPiAxXG4gICAgICBhcXVhY3VsdHVyZU9jZWFuUGVyY2VudDogcm91bmQoYXF1YWN1bHR1cmVPY2VhblBlcmNlbnQsIDIpXG4gICAgICBhcXVhY3VsdHVyZU9jZWFuQXJlYTogcm91bmQoYXF1YWN1bHR1cmVPY2VhbkFyZWEsIDEpXG4gICAgICBhcXVhY3VsdHVyZUxhZ29vbkFyZWE6IHJvdW5kKGFxdWFjdWx0dXJlTGFnb29uQXJlYSwgMilcbiAgICAgIGFxdWFjdWx0dXJlTGFnb29uUGVyY2VudDogcm91bmQoYXF1YWN1bHR1cmVMYWdvb25QZXJjZW50LCAxKVxuXG4gICAgICBudW1Nb29yaW5nczogbW9vcmluZ3MubGVuZ3RoXG4gICAgICBoYXNNb29yaW5nczogbW9vcmluZ3MubGVuZ3RoID4gMFxuICAgICAgbW9vcmluZ3NQbHVyYWw6IG1vb3JpbmdzLmxlbmd0aCA+IDFcbiAgICAgIG1vb3JpbmdzT2NlYW5QZXJjZW50OiByb3VuZChtb29yaW5nc09jZWFuUGVyY2VudCwgMilcbiAgICAgIG1vb3JpbmdzT2NlYW5BcmVhOiByb3VuZChtb29yaW5nc09jZWFuQXJlYSwgMSlcbiAgICAgIG1vb3JpbmdzTGFnb29uQXJlYTogcm91bmQobW9vcmluZ3NMYWdvb25BcmVhLCAyKVxuICAgICAgbW9vcmluZ3NMYWdvb25QZXJjZW50OiByb3VuZChtb29yaW5nc0xhZ29vblBlcmNlbnQsIDEpXG4gICAgICBcbiAgICAgIG51bUZpc2hpbmdBcmVhczogZmlzaGluZ0FyZWFzLmxlbmd0aFxuICAgICAgaGFzRmlzaGluZ0FyZWFzOiBmaXNoaW5nQXJlYXMubGVuZ3RoID4gMFxuICAgICAgZmlzaGluZ0FyZWFzUGx1cmFsOiBmaXNoaW5nQXJlYXMubGVuZ3RoID4gMVxuICAgICAgZmlzaGluZ0FyZWFzT2NlYW5QZXJjZW50OiByb3VuZChmaXNoaW5nQXJlYXNPY2VhblBlcmNlbnQsIDIpXG4gICAgICBmaXNoaW5nQXJlYXNPY2VhbkFyZWE6IHJvdW5kKGZpc2hpbmdBcmVhc09jZWFuQXJlYSwgMSlcbiAgICAgIGZpc2hpbmdBcmVhc0xhZ29vbkFyZWE6IHJvdW5kKGZpc2hpbmdBcmVhc0xhZ29vbkFyZWEsIDIpXG4gICAgICBmaXNoaW5nQXJlYXNMYWdvb25QZXJjZW50OiByb3VuZChmaXNoaW5nQXJlYXNMYWdvb25QZXJjZW50LCAxKVxuXG4gICAgICBoYXNTa2V0Y2hlczogaGFzU2tldGNoZXNcbiAgICAgIHNrZXRjaGVzUGx1cmFsOiBudW1Ub3RhbFpvbmVzID4gMVxuICAgICAgbnVtU2tldGNoZXM6IG51bVRvdGFsWm9uZXNcbiAgICAgIHN1bU9jZWFuQXJlYTogc3VtT2NlYW5BcmVhXG4gICAgICBzdW1PY2VhblBlcmNlbnQ6IHN1bU9jZWFuUGVyY2VudFxuICAgICAgc3VtTGFnb29uUGVyY2VudDogc3VtTGFnb29uUGVyY2VudFxuICAgICAgc3VtTGFnb29uQXJlYTogc3VtTGFnb29uQXJlYVxuICAgIFxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHBhcnRpYWxzKVxuXG4gICAgIyBub2RlcyA9IFtAbW9kZWxdXG4gICAgIyBAbW9kZWwuc2V0ICdvcGVuJywgdHJ1ZVxuICAgICMgbm9kZXMgPSBub2Rlcy5jb25jYXQgQGNoaWxkcmVuXG4gICAgIyBjb25zb2xlLmxvZyAnbm9kZXMnLCBub2RlcywgJ2NoaWxkcmVuJywgQGNoaWxkcmVuXG4gICAgIyBmb3Igbm9kZSBpbiBub2Rlc1xuICAgICMgICBub2RlLnNldCAnc2VsZWN0ZWQnLCBmYWxzZVxuICAgICMgVGFibGVPZkNvbnRlbnRzID0gd2luZG93LnJlcXVpcmUoJ3ZpZXdzL3RhYmxlT2ZDb250ZW50cycpXG4gICAgIyBAdG9jID0gbmV3IFRhYmxlT2ZDb250ZW50cyhub2RlcylcbiAgICAjIEAkKCcudG9jQ29udGFpbmVyJykuYXBwZW5kIEB0b2MuZWxcbiAgICAjIEB0b2MucmVuZGVyKClcblxuICByZW1vdmU6ICgpIC0+XG4gICAgQHRvYz8ucmVtb3ZlKClcbiAgICBzdXBlcigpXG5cbm1vZHVsZS5leHBvcnRzID0gQXJyYXlPdmVydmlld1RhYiIsIlJlcG9ydFRhYiA9IHJlcXVpcmUgJ3JlcG9ydFRhYidcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5yb3VuZCA9IHJlcXVpcmUoJ2FwaS91dGlscycpLnJvdW5kXG5UT1RBTF9BUkVBID0gMTY0LjggIyBzcSBtaWxlc1xuVE9UQUxfTEFHT09OX0FSRUEgPSAxMS4xXG5fcGFydGlhbHMgPSByZXF1aXJlICdhcGkvdGVtcGxhdGVzJ1xucGFydGlhbHMgPSBbXVxuZm9yIGtleSwgdmFsIG9mIF9wYXJ0aWFsc1xuICBwYXJ0aWFsc1trZXkucmVwbGFjZSgnbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpLycsICcnKV0gPSB2YWxcblxuY2xhc3MgQXJyYXlUcmFkZW9mZnNUYWIgZXh0ZW5kcyBSZXBvcnRUYWJcbiAgbmFtZTogJ1RyYWRlb2ZmcydcbiAgY2xhc3NOYW1lOiAndHJhZGVvZmZzJ1xuICB0ZW1wbGF0ZTogdGVtcGxhdGVzLmFycmF5VHJhZGVvZmZzXG4gIGRlcGVuZGVuY2llczogWydUcmFkZW9mZnNQcm9wSWQnXVxuICB0aW1lb3V0OiAxMjAwMDBcblxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICBjb250ZXh0ID1cbiAgICAgIHNrZXRjaDogQG1vZGVsLmZvclRlbXBsYXRlKClcbiAgICAgIHNrZXRjaENsYXNzOiBAc2tldGNoQ2xhc3MuZm9yVGVtcGxhdGUoKVxuICAgICAgYXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKVxuICAgICAgYWRtaW46IEBwcm9qZWN0LmlzQWRtaW4gd2luZG93LnVzZXJcbiAgICBAJGVsLmh0bWwgQHRlbXBsYXRlLnJlbmRlcihjb250ZXh0LCBwYXJ0aWFscylcblxuICAgIGlmIHdpbmRvdy5kM1xuICAgICAgdHJhZGVvZmZfZGF0YSA9IEByZWNvcmRTZXQoJ1RyYWRlb2Zmc1Byb3BJZCcsICdUcmFkZW9mZnNQcm9wSWQnKS50b0FycmF5KClcblxuICAgICAgaCA9IDM4MFxuICAgICAgdyA9IDM4MFxuICAgICAgbWFyZ2luID0ge2xlZnQ6NDAsIHRvcDo1LCByaWdodDo0MCwgYm90dG9tOiA0MCwgaW5uZXI6NX1cbiAgICAgIGhhbGZoID0gKGgrbWFyZ2luLnRvcCttYXJnaW4uYm90dG9tKVxuICAgICAgdG90YWxoID0gaGFsZmgqMlxuICAgICAgaGFsZncgPSAodyttYXJnaW4ubGVmdCttYXJnaW4ucmlnaHQpXG4gICAgICB0b3RhbHcgPSBoYWxmdyoyXG5cbiAgICAgICNtYWtlIHN1cmUgaXRzIEBzY2F0dGVycGxvdCB0byBwYXNzIGluIHRoZSByaWdodCBjb250ZXh0ICh0YWIpIGZvciBkM1xuICAgICAgbXljaGFydCA9IEBzY2F0dGVycGxvdCgpLnh2YXIoMClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnl2YXIoMSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnhsYWIoXCJGaXNoaW5nIFZhbHVlXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIC55bGFiKFwiRWNvbG9naWNhbCBWYWx1ZVwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuaGVpZ2h0KGgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIC53aWR0aCh3KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAubWFyZ2luKG1hcmdpbilcblxuXG4gICAgICBjaCA9IGQzLnNlbGVjdChAJCgnLnRyYWRlb2ZmLWNoYXJ0JykpXG4gICAgICBjaC5kYXR1bSh0cmFkZW9mZl9kYXRhKVxuICAgICAgICAuY2FsbChteWNoYXJ0KVxuXG4gICAgICB0b29sdGlwID0gZDMuc2VsZWN0KFwiYm9keVwiKVxuICAgICAgICAuYXBwZW5kKFwiZGl2XCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJjaGFydC10b29sdGlwXCIpXG4gICAgICAgIC5hdHRyKFwiaWRcIiwgXCJjaGFydC10b29sdGlwXCIpXG4gICAgICAgIC50ZXh0KFwiZGF0YVwiKVxuXG4gICAgICBteWNoYXJ0LnBvaW50c1NlbGVjdCgpXG4gICAgICAgIC5vbiBcIm1vdXNlb3ZlclwiLCAoZCkgLT4gcmV0dXJuIHRvb2x0aXAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwidmlzaWJsZVwiKS5odG1sKFwiPHVsPjxzdHJvbmc+UHJvcG9zYWw6IFwiK2QuUFJPUE9TQUwrXCI8L3N0cm9uZz48bGk+IEZpc2hpbmcgdmFsdWU6IFwiK2QuRklTSF9WQUwrXCI8L2xpPjxsaT4gQ29uc2VydmF0aW9uIHZhbHVlOiBcIitkLkVDT19WQUwrXCI8L2xpPjwvdWw+XCIpXG5cbiAgICAgIG15Y2hhcnQucG9pbnRzU2VsZWN0KClcbiAgICAgICAgLm9uIFwibW91c2Vtb3ZlXCIsIChkKSAtPiByZXR1cm4gdG9vbHRpcC5zdHlsZShcInRvcFwiLCAoZXZlbnQucGFnZVktMTApK1wicHhcIikuc3R5bGUoXCJsZWZ0XCIsKGNhbGNfdHRpcChldmVudC5wYWdlWCwgZCwgdG9vbHRpcCkpK1wicHhcIilcblxuICAgICAgbXljaGFydC5wb2ludHNTZWxlY3QoKVxuICAgICAgICAub24gXCJtb3VzZW91dFwiLCAoZCkgLT4gcmV0dXJuIHRvb2x0aXAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpXG5cbiAgICAgIG15Y2hhcnQubGFiZWxzU2VsZWN0KClcbiAgICAgICAgLm9uIFwibW91c2VvdmVyXCIsIChkKSAtPiByZXR1cm4gdG9vbHRpcC5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJ2aXNpYmxlXCIpLmh0bWwoXCI8dWw+PHN0cm9uZz5Qcm9wb3NhbDogXCIrZC5QUk9QT1NBTCtcIjwvc3Ryb25nPjxsaT4gRmlzaGluZyB2YWx1ZTogXCIrZC5GSVNIX1ZBTCtcIjwvbGk+PGxpPiBDb25zZXJ2YXRpb24gdmFsdWU6IFwiK2QuRUNPX1ZBTCtcIjwvbGk+PC91bD5cIilcblxuICAgICAgbXljaGFydC5sYWJlbHNTZWxlY3QoKVxuICAgICAgICAub24gXCJtb3VzZW1vdmVcIiwgKGQpIC0+IHJldHVybiB0b29sdGlwLnN0eWxlKFwidG9wXCIsIChldmVudC5wYWdlWS0xMCkrXCJweFwiKS5zdHlsZShcImxlZnRcIiwoY2FsY190dGlwKGV2ZW50LnBhZ2VYLCBkLCB0b29sdGlwKSkrXCJweFwiKVxuXG4gICAgICBteWNoYXJ0LmxhYmVsc1NlbGVjdCgpXG4gICAgICAgIC5vbiBcIm1vdXNlb3V0XCIsIChkKSAtPiByZXR1cm4gdG9vbHRpcC5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJoaWRkZW5cIilcblxuICBjYWxjX3R0aXAgPSAoeGxvYywgZGF0YSwgdG9vbHRpcCkgLT5cbiAgICB0ZGl2ID0gdG9vbHRpcFswXVswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgIHRsZWZ0ID0gdGRpdi5sZWZ0XG4gICAgdHcgPSB0ZGl2LndpZHRoXG4gICAgcmV0dXJuIHhsb2MtKHR3KzEwKSBpZiAoeGxvYyt0dyA+IHRsZWZ0K3R3KVxuICAgIHJldHVybiB4bG9jKzEwXG5cblxuICBzY2F0dGVycGxvdDogKCkgPT5cbiAgICB2aWV3ID0gQFxuICAgIHdpZHRoID0gMzgwXG4gICAgaGVpZ2h0ID0gNjAwXG4gICAgbWFyZ2luID0ge2xlZnQ6NDAsIHRvcDo1LCByaWdodDo0MCwgYm90dG9tOiA0MCwgaW5uZXI6NX1cbiAgICBheGlzcG9zID0ge3h0aXRsZToyNSwgeXRpdGxlOjMwLCB4bGFiZWw6NSwgeWxhYmVsOjV9XG4gICAgeGxpbSA9IG51bGxcbiAgICB5bGltID0gbnVsbFxuICAgIG54dGlja3MgPSA1XG4gICAgeHRpY2tzID0gbnVsbFxuICAgIG55dGlja3MgPSA1XG4gICAgeXRpY2tzID0gbnVsbFxuICAgICNyZWN0Y29sb3IgPSBkMy5yZ2IoMjMwLCAyMzAsIDIzMClcbiAgICByZWN0Y29sb3IgPSBcIiNkYmU0ZWVcIlxuICAgIHBvaW50c2l6ZSA9IDUgIyBkZWZhdWx0ID0gbm8gdmlzaWJsZSBwb2ludHMgYXQgbWFya2Vyc1xuICAgIHhsYWIgPSBcIlhcIlxuICAgIHlsYWIgPSBcIlkgc2NvcmVcIlxuICAgIHlzY2FsZSA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgeHNjYWxlID0gZDMuc2NhbGUubGluZWFyKClcbiAgICBsZWdlbmRoZWlnaHQgPSAzMDBcbiAgICBwb2ludHNTZWxlY3QgPSBudWxsXG4gICAgbGFiZWxzU2VsZWN0ID0gbnVsbFxuICAgIGxlZ2VuZFNlbGVjdCA9IG51bGxcbiAgICBpZiB3aW5kb3cuZDNcbiAgICAgICNjbGVhciBvdXQgdGhlIG9sZCB2YWx1ZXNcbiAgICAgIHZpZXcuJCgnLnRyYWRlb2ZmLWNoYXJ0JykuaHRtbCgnJylcbiAgICAgIGVsID0gdmlldy4kKCcudHJhZGVvZmYtY2hhcnQnKVswXVxuXG4gICAgIyMgdGhlIG1haW4gZnVuY3Rpb25cbiAgICBjaGFydCA9IChzZWxlY3Rpb24pIC0+XG4gICAgICBzZWxlY3Rpb24uZWFjaCAoZGF0YSkgLT5cbiAgICAgICAgeCA9IGRhdGEubWFwIChkKSAtPiBwYXJzZUZsb2F0KGQuRklTSF9WQUwpXG4gICAgICAgIHkgPSBkYXRhLm1hcCAoZCkgLT4gcGFyc2VGbG9hdChkLkVDT19WQUwpXG5cblxuICAgICAgICBwYW5lbG9mZnNldCA9IDBcbiAgICAgICAgcGFuZWx3aWR0aCA9IHdpZHRoXG5cbiAgICAgICAgcGFuZWxoZWlnaHQgPSBoZWlnaHRcblxuICAgICAgICB4bGltID0gW2QzLm1pbih4KS0yLCBwYXJzZUZsb2F0KGQzLm1heCh4KSsyKV0gaWYgISh4bGltPylcblxuICAgICAgICB5bGltID0gW2QzLm1pbih5KS0yLCBwYXJzZUZsb2F0KGQzLm1heCh5KSsyKV0gaWYgISh5bGltPylcblxuICAgICAgICAjIEknbGwgcmVwbGFjZSBtaXNzaW5nIHZhbHVlcyBzb21ldGhpbmcgc21hbGxlciB0aGFuIHdoYXQncyBvYnNlcnZlZFxuICAgICAgICBuYV92YWx1ZSA9IGQzLm1pbih4LmNvbmNhdCB5KSAtIDEwMFxuICAgICAgICBjdXJyZWxlbSA9IGQzLnNlbGVjdCh2aWV3LiQoJy50cmFkZW9mZi1jaGFydCcpWzBdKVxuICAgICAgICBzdmcgPSBkMy5zZWxlY3Qodmlldy4kKCcudHJhZGVvZmYtY2hhcnQnKVswXSkuYXBwZW5kKFwic3ZnXCIpLmRhdGEoW2RhdGFdKVxuICAgICAgICBzdmcuYXBwZW5kKFwiZ1wiKVxuXG4gICAgICAgICMgVXBkYXRlIHRoZSBvdXRlciBkaW1lbnNpb25zLlxuICAgICAgICBzdmcuYXR0cihcIndpZHRoXCIsIHdpZHRoK21hcmdpbi5sZWZ0K21hcmdpbi5yaWdodClcbiAgICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0K21hcmdpbi50b3ArbWFyZ2luLmJvdHRvbStkYXRhLmxlbmd0aCozNSlcblxuICAgICAgICBnID0gc3ZnLnNlbGVjdChcImdcIilcblxuICAgICAgICAjIGJveFxuICAgICAgICBnLmFwcGVuZChcInJlY3RcIilcbiAgICAgICAgIC5hdHRyKFwieFwiLCBwYW5lbG9mZnNldCttYXJnaW4ubGVmdClcbiAgICAgICAgIC5hdHRyKFwieVwiLCBtYXJnaW4udG9wKVxuICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgcGFuZWxoZWlnaHQpXG4gICAgICAgICAuYXR0cihcIndpZHRoXCIsIHBhbmVsd2lkdGgpXG4gICAgICAgICAuYXR0cihcImZpbGxcIiwgcmVjdGNvbG9yKVxuICAgICAgICAgLmF0dHIoXCJzdHJva2VcIiwgXCJub25lXCIpXG5cblxuICAgICAgICAjIHNpbXBsZSBzY2FsZXMgKGlnbm9yZSBOQSBidXNpbmVzcylcbiAgICAgICAgeHJhbmdlID0gW21hcmdpbi5sZWZ0K3BhbmVsb2Zmc2V0K21hcmdpbi5pbm5lciwgbWFyZ2luLmxlZnQrcGFuZWxvZmZzZXQrcGFuZWx3aWR0aC1tYXJnaW4uaW5uZXJdXG4gICAgICAgIHlyYW5nZSA9IFttYXJnaW4udG9wK3BhbmVsaGVpZ2h0LW1hcmdpbi5pbm5lciwgbWFyZ2luLnRvcCttYXJnaW4uaW5uZXJdXG4gICAgICAgIHhzY2FsZS5kb21haW4oeGxpbSkucmFuZ2UoeHJhbmdlKVxuICAgICAgICB5c2NhbGUuZG9tYWluKHlsaW0pLnJhbmdlKHlyYW5nZSlcbiAgICAgICAgeHMgPSBkMy5zY2FsZS5saW5lYXIoKS5kb21haW4oeGxpbSkucmFuZ2UoeHJhbmdlKVxuICAgICAgICB5cyA9IGQzLnNjYWxlLmxpbmVhcigpLmRvbWFpbih5bGltKS5yYW5nZSh5cmFuZ2UpXG5cblxuICAgICAgICAjIGlmIHl0aWNrcyBub3QgcHJvdmlkZWQsIHVzZSBueXRpY2tzIHRvIGNob29zZSBwcmV0dHkgb25lc1xuICAgICAgICB5dGlja3MgPSB5cy50aWNrcyhueXRpY2tzKSBpZiAhKHl0aWNrcz8pXG4gICAgICAgIHh0aWNrcyA9IHhzLnRpY2tzKG54dGlja3MpIGlmICEoeHRpY2tzPylcblxuICAgICAgICAjIHgtYXhpc1xuICAgICAgICB4YXhpcyA9IGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJ4IGF4aXNcIilcbiAgICAgICAgeGF4aXMuc2VsZWN0QWxsKFwiZW1wdHlcIilcbiAgICAgICAgICAgICAuZGF0YSh4dGlja3MpXG4gICAgICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAgICAuYXBwZW5kKFwibGluZVwiKVxuICAgICAgICAgICAgIC5hdHRyKFwieDFcIiwgKGQpIC0+IHhzY2FsZShkKSlcbiAgICAgICAgICAgICAuYXR0cihcIngyXCIsIChkKSAtPiB4c2NhbGUoZCkpXG4gICAgICAgICAgICAgLmF0dHIoXCJ5MVwiLCBtYXJnaW4udG9wKVxuICAgICAgICAgICAgIC5hdHRyKFwieTJcIiwgbWFyZ2luLnRvcCtoZWlnaHQpXG4gICAgICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIFwibm9uZVwiKVxuICAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIFwid2hpdGVcIilcbiAgICAgICAgICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCAxKVxuICAgICAgICAgICAgIC5zdHlsZShcInBvaW50ZXItZXZlbnRzXCIsIFwibm9uZVwiKVxuICAgICAgICB4YXhpcy5zZWxlY3RBbGwoXCJlbXB0eVwiKVxuICAgICAgICAgICAgIC5kYXRhKHh0aWNrcylcbiAgICAgICAgICAgICAuZW50ZXIoKVxuICAgICAgICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIChkKSAtPiB4c2NhbGUoZCkpXG4gICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIG1hcmdpbi50b3AraGVpZ2h0K2F4aXNwb3MueGxhYmVsKVxuICAgICAgICAgICAgIC50ZXh0KChkKSAtPiBmb3JtYXRBeGlzKHh0aWNrcykoZCkpXG4gICAgICAgIHhheGlzLmFwcGVuZChcInRleHRcIikuYXR0cihcImNsYXNzXCIsIFwieGF4aXMtdGl0bGVcIilcbiAgICAgICAgICAgICAuYXR0cihcInhcIiwgbWFyZ2luLmxlZnQrd2lkdGgvMilcbiAgICAgICAgICAgICAuYXR0cihcInlcIiwgbWFyZ2luLnRvcCtoZWlnaHQrYXhpc3Bvcy54dGl0bGUpXG4gICAgICAgICAgICAgLnRleHQoeGxhYilcbiAgICAgICAgeGF4aXMuc2VsZWN0QWxsKFwiZW1wdHlcIilcbiAgICAgICAgICAgICAuZGF0YShkYXRhKVxuICAgICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgICAgLmFwcGVuZChcImNpcmNsZVwiKVxuICAgICAgICAgICAgIC5hdHRyKFwiY3hcIiwgKGQsaSkgLT4gbWFyZ2luLmxlZnQpXG4gICAgICAgICAgICAgLmF0dHIoXCJjeVwiLCAoZCxpKSAtPiBtYXJnaW4udG9wK2hlaWdodCtheGlzcG9zLnh0aXRsZSsoKGkrMSkqMzApKzYpXG4gICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCAoZCxpKSAtPiBcInB0I3tpfVwiKVxuICAgICAgICAgICAgIC5hdHRyKFwiclwiLCBwb2ludHNpemUpXG4gICAgICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIChkLGkpIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZhbCA9IGkgJSAxN1xuICAgICAgICAgICAgICAgICAgICAgICAgICBjb2wgPSBnZXRDb2xvcnModmFsKVxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAuYXR0cihcInN0cm9rZVwiLCAoZCwgaSkgLT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsID0gTWF0aC5mbG9vcihpLzE3KSAlIDVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29sID0gZ2V0U3Ryb2tlQ29sb3IodmFsKVxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCBcIjFcIilcblxuICAgICAgICB4YXhpcy5zZWxlY3RBbGwoXCJlbXB0eVwiKVxuICAgICAgICAgICAgIC5kYXRhKGRhdGEpXG4gICAgICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJsZWdlbmQtdGV4dFwiKVxuXG4gICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIChkLGkpIC0+XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hcmdpbi5sZWZ0KzIwKVxuICAgICAgICAgICAgIC5hdHRyKFwieVwiLCAoZCxpKSAtPlxuICAgICAgICAgICAgICAgIG1hcmdpbi50b3AraGVpZ2h0K2F4aXNwb3MueHRpdGxlKygoaSsxKSozMCkpXG4gICAgICAgICAgICAgLnRleHQoKGQpIC0+IHJldHVybiBkLlBST1BPU0FMKVxuXG4gICAgICAgICMgeS1heGlzXG4gICAgICAgIHlheGlzID0gZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJjbGFzc1wiLCBcInkgYXhpc1wiKVxuICAgICAgICB5YXhpcy5zZWxlY3RBbGwoXCJlbXB0eVwiKVxuICAgICAgICAgICAgIC5kYXRhKHl0aWNrcylcbiAgICAgICAgICAgICAuZW50ZXIoKVxuICAgICAgICAgICAgIC5hcHBlbmQoXCJsaW5lXCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJ5MVwiLCAoZCkgLT4geXNjYWxlKGQpKVxuICAgICAgICAgICAgIC5hdHRyKFwieTJcIiwgKGQpIC0+IHlzY2FsZShkKSlcbiAgICAgICAgICAgICAuYXR0cihcIngxXCIsIG1hcmdpbi5sZWZ0KVxuICAgICAgICAgICAgIC5hdHRyKFwieDJcIiwgbWFyZ2luLmxlZnQrd2lkdGgpXG4gICAgICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIFwibm9uZVwiKVxuICAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIFwid2hpdGVcIilcbiAgICAgICAgICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCAxKVxuICAgICAgICAgICAgIC5zdHlsZShcInBvaW50ZXItZXZlbnRzXCIsIFwibm9uZVwiKVxuICAgICAgICB5YXhpcy5zZWxlY3RBbGwoXCJlbXB0eVwiKVxuICAgICAgICAgICAgIC5kYXRhKHl0aWNrcylcbiAgICAgICAgICAgICAuZW50ZXIoKVxuICAgICAgICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIChkKSAtPiB5c2NhbGUoZCkpXG4gICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIG1hcmdpbi5sZWZ0LWF4aXNwb3MueWxhYmVsKVxuICAgICAgICAgICAgIC50ZXh0KChkKSAtPiBmb3JtYXRBeGlzKHl0aWNrcykoZCkpXG4gICAgICAgIHlheGlzLmFwcGVuZChcInRleHRcIikuYXR0cihcImNsYXNzXCIsIFwidGl0bGVcIilcbiAgICAgICAgICAgICAuYXR0cihcInlcIiwgbWFyZ2luLnRvcCtoZWlnaHQvMilcbiAgICAgICAgICAgICAuYXR0cihcInhcIiwgbWFyZ2luLmxlZnQtYXhpc3Bvcy55dGl0bGUpXG4gICAgICAgICAgICAgLnRleHQoeWxhYilcbiAgICAgICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInJvdGF0ZSgyNzAsI3ttYXJnaW4ubGVmdC1heGlzcG9zLnl0aXRsZX0sI3ttYXJnaW4udG9wK2hlaWdodC8yfSlcIilcblxuXG4gICAgICAgIGxhYmVscyA9IGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiaWRcIiwgXCJsYWJlbHNcIilcbiAgICAgICAgbGFiZWxzU2VsZWN0ID1cbiAgICAgICAgICBsYWJlbHMuc2VsZWN0QWxsKFwiZW1wdHlcIilcbiAgICAgICAgICAgICAgICAuZGF0YShkYXRhKVxuICAgICAgICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgICAgICAgLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgICAgICAgICAudGV4dCgoZCktPiByZXR1cm4gZC5QUk9QT1NBTClcbiAgICAgICAgICAgICAgICAuYXR0cihcInhcIiwgKGQsaSkgLT5cbiAgICAgICAgICAgICAgICAgIHhwb3MgPSB4c2NhbGUoeFtpXSlcbiAgICAgICAgICAgICAgICAgIHN0cmluZ19lbmQgPSB4cG9zK3RoaXMuZ2V0Q29tcHV0ZWRUZXh0TGVuZ3RoKClcbiAgICAgICAgICAgICAgICAgIG92ZXJsYXBfeHN0YXJ0ID0geHBvcy0odGhpcy5nZXRDb21wdXRlZFRleHRMZW5ndGgoKSs1KVxuICAgICAgICAgICAgICAgICAgcmV0dXJuIG92ZXJsYXBfeHN0YXJ0IGlmIHN0cmluZ19lbmQgPiB3aWR0aFxuICAgICAgICAgICAgICAgICAgcmV0dXJuIHhwb3MrNVxuICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwieVwiLCAoZCxpKSAtPlxuICAgICAgICAgICAgICAgICAgeXBvcyA9IHlzY2FsZSh5W2ldKVxuICAgICAgICAgICAgICAgICAgcmV0dXJuIHlwb3MrMTAgaWYgKHlwb3MgPCA1MClcbiAgICAgICAgICAgICAgICAgIHJldHVybiB5cG9zLTVcbiAgICAgICAgICAgICAgICAgIClcblxuXG5cbiAgICAgICAgcG9pbnRzID0gZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJpZFwiLCBcInBvaW50c1wiKVxuICAgICAgICBwb2ludHNTZWxlY3QgPVxuICAgICAgICAgIHBvaW50cy5zZWxlY3RBbGwoXCJlbXB0eVwiKVxuICAgICAgICAgICAgICAgIC5kYXRhKGRhdGEpXG4gICAgICAgICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAgICAgICAuYXBwZW5kKFwiY2lyY2xlXCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJjeFwiLCAoZCxpKSAtPiB4c2NhbGUoeFtpXSkpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJjeVwiLCAoZCxpKSAtPiB5c2NhbGUoeVtpXSkpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCAoZCxpKSAtPiBcInB0I3tpfVwiKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwiclwiLCBwb2ludHNpemUpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIChkLGkpIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZhbCA9IGlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29sID0gZ2V0Q29sb3JzKFt2YWxdKVxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAuYXR0cihcInN0cm9rZVwiLCAoZCwgaSkgLT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsID0gTWF0aC5mbG9vcihpLzE3KSAlIDVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29sID0gZ2V0U3Ryb2tlQ29sb3IodmFsKVxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCBcIjFcIilcbiAgICAgICAgICAgICAgICAuYXR0cihcIm9wYWNpdHlcIiwgKGQsaSkgLT5cbiAgICAgICAgICAgICAgICAgICAgIHJldHVybiAxIGlmICh4W2ldPyBvciB4TkEuaGFuZGxlKSBhbmQgKHlbaV0/IG9yIHlOQS5oYW5kbGUpXG4gICAgICAgICAgICAgICAgICAgICByZXR1cm4gMClcblxuICAgICAgICAjIGJveFxuICAgICAgICBnLmFwcGVuZChcInJlY3RcIilcbiAgICAgICAgICAgICAgIC5hdHRyKFwieFwiLCBtYXJnaW4ubGVmdCtwYW5lbG9mZnNldClcbiAgICAgICAgICAgICAgIC5hdHRyKFwieVwiLCBtYXJnaW4udG9wKVxuICAgICAgICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgcGFuZWxoZWlnaHQpXG4gICAgICAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIHBhbmVsd2lkdGgpXG4gICAgICAgICAgICAgICAuYXR0cihcImZpbGxcIiwgXCJub25lXCIpXG4gICAgICAgICAgICAgICAuYXR0cihcInN0cm9rZVwiLCBcImJsYWNrXCIpXG4gICAgICAgICAgICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCBcIm5vbmVcIilcblxuXG5cbiAgICAjIyBjb25maWd1cmF0aW9uIHBhcmFtZXRlcnNcblxuXG4gICAgY2hhcnQud2lkdGggPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4gd2lkdGggaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHdpZHRoID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC5oZWlnaHQgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4gaGVpZ2h0IGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICBoZWlnaHQgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0Lm1hcmdpbiA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiBtYXJnaW4gaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIG1hcmdpbiA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQuYXhpc3BvcyA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiBheGlzcG9zIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICBheGlzcG9zID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC54bGltID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHhsaW0gaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHhsaW0gPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0Lm54dGlja3MgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4gbnh0aWNrcyBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgbnh0aWNrcyA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQueHRpY2tzID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHh0aWNrcyBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgeHRpY2tzID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC55bGltID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHlsaW0gaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHlsaW0gPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0Lm55dGlja3MgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4gbnl0aWNrcyBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgbnl0aWNrcyA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQueXRpY2tzID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHl0aWNrcyBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgeXRpY2tzID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC5yZWN0Y29sb3IgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4gcmVjdGNvbG9yIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICByZWN0Y29sb3IgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0LnBvaW50Y29sb3IgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4gcG9pbnRjb2xvciBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgcG9pbnRjb2xvciA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQucG9pbnRzaXplID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHBvaW50c2l6ZSBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgcG9pbnRzaXplID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC5wb2ludHN0cm9rZSA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiBwb2ludHN0cm9rZSBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgcG9pbnRzdHJva2UgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0LnhsYWIgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4geGxhYiBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgeGxhYiA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQueWxhYiA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiB5bGFiIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICB5bGFiID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC54dmFyID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHh2YXIgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHh2YXIgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0Lnl2YXIgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4geXZhciBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgeXZhciA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQueXNjYWxlID0gKCkgLT5cbiAgICAgIHJldHVybiB5c2NhbGVcblxuICAgIGNoYXJ0LnhzY2FsZSA9ICgpIC0+XG4gICAgICByZXR1cm4geHNjYWxlXG5cbiAgICBjaGFydC5wb2ludHNTZWxlY3QgPSAoKSAtPlxuICAgICAgcmV0dXJuIHBvaW50c1NlbGVjdFxuXG4gICAgY2hhcnQubGFiZWxzU2VsZWN0ID0gKCkgLT5cbiAgICAgIHJldHVybiBsYWJlbHNTZWxlY3RcblxuICAgIGNoYXJ0LmxlZ2VuZFNlbGVjdCA9ICgpIC0+XG4gICAgICByZXR1cm4gbGVnZW5kU2VsZWN0XG5cbiAgICAjIHJldHVybiB0aGUgY2hhcnQgZnVuY3Rpb25cbiAgICBjaGFydFxuXG4gIGdldENvbG9ycyA9IChpKSAtPlxuICAgIGNvbG9ycyA9IFtcIkxpZ2h0R3JlZW5cIiwgXCJMaWdodFBpbmtcIiwgXCJMaWdodFNreUJsdWVcIiwgXCJNb2NjYXNpblwiLCBcIkJsdWVWaW9sZXRcIiwgXCJHYWluc2Jvcm9cIiwgXCJEYXJrR3JlZW5cIiwgXCJEYXJrVHVycXVvaXNlXCIsIFwibWFyb29uXCIsIFwibmF2eVwiLCBcIkxlbW9uQ2hpZmZvblwiLCBcIm9yYW5nZVwiLCAgXCJyZWRcIiwgXCJzaWx2ZXJcIiwgXCJ0ZWFsXCIsIFwid2hpdGVcIiwgXCJibGFja1wiXVxuICAgIHJldHVybiBjb2xvcnNbaV1cblxuICBnZXRTdHJva2VDb2xvciA9IChpKSAtPlxuICAgIHNjb2xvcnMgPSBbXCJibGFja1wiLCBcIndoaXRlXCIsIFwiZ3JheVwiLCBcImJyb3duXCIsIFwiTmF2eVwiXVxuICAgIHJldHVybiBzY29sb3JzW2ldXG5cbiAgIyBmdW5jdGlvbiB0byBkZXRlcm1pbmUgcm91bmRpbmcgb2YgYXhpcyBsYWJlbHNcbiAgZm9ybWF0QXhpcyA9IChkKSAtPlxuICAgIGQgPSBkWzFdIC0gZFswXVxuICAgIG5kaWcgPSBNYXRoLmZsb29yKCBNYXRoLmxvZyhkICUgMTApIC8gTWF0aC5sb2coMTApIClcbiAgICBuZGlnID0gMCBpZiBuZGlnID4gMFxuICAgIG5kaWcgPSBNYXRoLmFicyhuZGlnKVxuICAgIGQzLmZvcm1hdChcIi4je25kaWd9ZlwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEFycmF5VHJhZGVvZmZzVGFiXG4iLCJtb2R1bGUuZXhwb3J0cyA9IFxuICBTQU5DVFVBUllfSUQ6ICc1MWZhZWJlZjhmYWEzMDliN2MwNWRlMDInXG4gIEFRVUFDVUxUVVJFX0lEOiAnNTIwYmIxYzAwYmQyMmM5YjIxNDdiOTliJ1xuICBNT09SSU5HX0lEOiAnNTIwZDNkYzQ2NzQ2NTljYjdiMzQ4MGY1J1xuICBGSVNISU5HX1BSSU9SSVRZX0FSRUFfSUQ6ICc1MjBiYjFkMDBiZDIyYzliMjE0N2I5ZDAnXG4gIE5PX05FVF9aT05FU19JRDogJzUyNGM1YmMyMmZiZDcyNjExNzAwMDAzNCdcbiIsInRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5BcnJheU92ZXJ2aWV3VGFiID0gcmVxdWlyZSAnLi9hcnJheU92ZXJ2aWV3VGFiLmNvZmZlZSdcbkFycmF5SGFiaXRhdFRhYiA9IHJlcXVpcmUgJy4vYXJyYXlIYWJpdGF0VGFiLmNvZmZlZSdcbkFycmF5RmlzaGluZ1ZhbHVlVGFiID0gcmVxdWlyZSAnLi9hcnJheUZpc2hpbmdWYWx1ZVRhYi5jb2ZmZWUnXG5BcnJheVRyYWRlb2Zmc1RhYiA9IHJlcXVpcmUgJy4vYXJyYXlUcmFkZW9mZnMuY29mZmVlJ1xuI092ZXJ2aWV3VGFiID0gcmVxdWlyZSAnLi9vdmVydmlld1RhYi5jb2ZmZWUnXG53aW5kb3cuYXBwLnJlZ2lzdGVyUmVwb3J0IChyZXBvcnQpIC0+XG4gIHJlcG9ydC50YWJzIFtBcnJheU92ZXJ2aWV3VGFiLCBBcnJheUhhYml0YXRUYWIsIEFycmF5RmlzaGluZ1ZhbHVlVGFiLCBBcnJheVRyYWRlb2Zmc1RhYl1cbiAgI3JlcG9ydC50YWJzIFtPdmVydmlld1RhYl1cbiAgIyBwYXRoIG11c3QgYmUgcmVsYXRpdmUgdG8gZGlzdC9cbiAgcmVwb3J0LnN0eWxlc2hlZXRzIFsnLi9wcm9wb3NhbC5jc3MnXSIsInRoaXNbXCJUZW1wbGF0ZXNcIl0gPSB0aGlzW1wiVGVtcGxhdGVzXCJdIHx8IHt9O1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcImFxdWFjdWx0dXJlRmlzaGluZ1ZhbHVlXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkZpc2hpbmcgVmFsdWU8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhpcyBhcXVhY3VsdHVyZSBhcmVhIGRpc3BsYWNlcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBvZiB0aGUgZmlzaGluZyB2YWx1ZSB3aXRoaW4gQmFyYnVkYeKAmXMgd2F0ZXJzLCBiYXNlZCBvbiB1c2VyIHJlcG9ydGVkXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIHZhbHVlcyBvZiBmaXNoaW5nIGdyb3VuZHMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MzNmMTZmNmE0OTg4NjdjNTZjNmZiNTdcXFwiPnNob3cgZmlzaGluZyB2YWx1ZXMgbGF5ZXI8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJhcnJheUZpc2hpbmdWYWx1ZVwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5EaXNwbGFjZWQgRmlzaGluZyBWYWx1ZTwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJzYW5jdHVhcmllc1wiLGMscCwxKSxjLHAsMCwxMDMsMzg5LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtpZihfLnMoXy5mKFwiYXF1YWN1bHR1cmVBcmVhc1wiLGMscCwxKSxjLHAsMCwxMjksMzYzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgVGhpcyBwcm9wb3NhbCBpbmNsdWRlcyBib3RoIFNhbmN0dWFyeSBhbmQgQXF1YWN1bHR1cmUgYXJlYXMsIGRpc3BsYWNpbmdcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJzYW5jdHVhcnlQZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBhbmQgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJhcXVhY3VsdHVyZUFyZWFQZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgb2YgZmlzaGluZyB2YWx1ZSB3aXRoaW4gQmFyYnVkYSdzIHdhdGVycywgcmVzcGVjdGl2ZWx5LlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9fSk7Yy5wb3AoKTt9aWYoXy5zKF8uZihcInNhbmN0dWFyaWVzXCIsYyxwLDEpLGMscCwwLDQyNiw3NjUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe2lmKCFfLnMoXy5mKFwiYXF1YWN1bHR1cmVBcmVhc1wiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgICBUaGlzIHByb3Bvc2FsIGluY2x1ZGVzIFwiKTtfLmIoXy52KF8uZihcIm51bVNhbmN0dWFyaWVzXCIsYyxwLDApKSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgXCIpO2lmKF8ucyhfLmYoXCJzYW5jUGx1cmFsXCIsYyxwLDEpLGMscCwwLDUxOCw1MjksXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIlNhbmN0dWFyaWVzXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwic2FuY1BsdXJhbFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIlNhbmN0dWFyeVwiKTt9O18uYihcIixcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgZGlzcGxhY2luZyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInNhbmN0dWFyeVBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIGZpc2hpbmcgdmFsdWUgd2l0aGluIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBCYXJidWRhJ3Mgd2F0ZXJzIGJhc2VkIG9uIHVzZXIgcmVwb3J0ZWQgdmFsdWVzIG9mIGZpc2hpbmcgZ3JvdW5kcy5cIik7Xy5iKFwiXFxuXCIpO307fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJzYW5jdHVhcmllc1wiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe2lmKF8ucyhfLmYoXCJhcXVhY3VsdHVyZUFyZWFzXCIsYyxwLDEpLGMscCwwLDgyOCwxMTM1LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPGJyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8YnI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoaXMgcHJvcG9zYWwgaW5jbHVkZXMgXCIpO18uYihfLnYoXy5mKFwibnVtQXF1YWN1bHR1cmVBcmVhc1wiLGMscCwwKSkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIEFxdWFjdWx0dXJlIEFyZWFcIik7aWYoXy5zKF8uZihcImFxdWFjdWx0dXJlQXJlYXNQbHVyYWxcIixjLHAsMSksYyxwLDAsOTQ1LDk0NixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic1wiKTt9KTtjLnBvcCgpO31fLmIoXCIsXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIGRpc3BsYWNpbmcgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJhcXVhY3VsdHVyZUFyZWFQZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiBmaXNoaW5nIHZhbHVlIHdpdGhpbiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgQmFyYnVkYSdzIHdhdGVycyBiYXNlZCBvbiB1c2VyIHJlcG9ydGVkIHZhbHVlcyBvZiBmaXNoaW5nIGdyb3VuZHMuXCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO319O2lmKF8ucyhfLmYoXCJtb29yaW5nc1wiLGMscCwxKSxjLHAsMCwxMTk1LDE1MjUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8YnI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxicj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgXCIpO18uYihfLnYoXy5mKFwibnVtTW9vcmluZ3NcIixjLHAsMCkpKTtfLmIoXCIgTW9vcmluZyBBcmVhXCIpO2lmKF8ucyhfLmYoXCJtb29yaW5nc1BsdXJhbFwiLGMscCwxKSxjLHAsMCwxMjY1LDEyNzAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInMgYXJlXCIpO30pO2MucG9wKCk7fV8uYihcIiBcIik7aWYoIV8ucyhfLmYoXCJtb29yaW5nc1BsdXJhbFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcImlzXCIpO307Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgYWxzbyBpbmNsdWRlZCwgd2hpY2ggY292ZXJcIik7aWYoIV8ucyhfLmYoXCJtb29yaW5nc1BsdXJhbFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcInNcIik7fTtfLmIoXCIgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJtb29yaW5nQXJlYVBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICByZWdpb25hbCBmaXNoaW5nIHZhbHVlLiBNb29yaW5nIGFyZWFzIG1heSBkaXNwbGFjZSBmaXNoaW5nIGFjdGl2aXRpZXMuXCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZihfLnMoXy5mKFwiaGFzTm9OZXRab25lc1wiLGMscCwxKSxjLHAsMCwxNTYxLDE5MDMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8YnI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxicj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgXCIpO18uYihfLnYoXy5mKFwibnVtTm9OZXRab25lc1wiLGMscCwwKSkpO18uYihcIiBOb3QgTmV0IFpvbmVcIik7aWYoXy5zKF8uZihcIm5vTmV0Wm9uZXNQbHVyYWxcIixjLHAsMSksYyxwLDAsMTYzNSwxNjQwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzIGFyZVwiKTt9KTtjLnBvcCgpO31fLmIoXCIgXCIpO2lmKCFfLnMoXy5mKFwibm9OZXRab25lc1BsdXJhbFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcImlzXCIpO307Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgYWxzbyBpbmNsdWRlZCwgd2hpY2ggY292ZXJcIik7aWYoIV8ucyhfLmYoXCJub05ldFpvbmVzUGx1cmFsXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwic1wiKTt9O18uYihcIiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm5vTmV0Wm9uZXNQZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgcmVnaW9uYWwgZmlzaGluZyB2YWx1ZS4gTm8gTmV0IFpvbmVzIG1heSBkaXNwbGFjZSBmaXNoaW5nIGFjdGl2aXRpZXMuXCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjUzM2YxNmY2YTQ5ODg2N2M1NmM2ZmI1N1xcXCI+c2hvdyBmaXNoaW5nIHZhbHVlcyBsYXllcjwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJmaXNoaW5nQXJlYXNcIixjLHAsMSksYyxwLDAsMjA0MiwyNDE0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5Qcmlvcml0eSBGaXNoaW5nIEFyZWFzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoaXMgcHJvcG9zYWwgaW5jbHVkZXMgXCIpO18uYihfLnYoXy5mKFwibnVtRmlzaGluZ0FyZWFzXCIsYyxwLDApKSk7Xy5iKFwiIEZpc2hpbmcgUHJpb3JpdHkgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIEFyZWFcIik7aWYoXy5zKF8uZihcImZpc2hpbmdBcmVhUHVyYWxcIixjLHAsMSksYyxwLDAsMjIxOSwyMjIwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzXCIpO30pO2MucG9wKCk7fV8uYihcIiwgcmVwcmVzZW50aW5nXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiZmlzaGluZ0FyZWFQZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiB0aGUgZmlzaGluZyB2YWx1ZSB3aXRoaW4gQmFyYnVkYSdzIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICB3YXRlcnMgYmFzZWQgb24gdXNlciByZXBvcnRlZCB2YWx1ZXMgb2YgZmlzaGluZyBncm91bmRzXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31yZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJhcnJheUhhYml0YXRzXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO2lmKF8ucyhfLmYoXCJzYW5jdHVhcmllc1wiLGMscCwxKSxjLHAsMCwxNiw5MTksXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkhhYml0YXRzIHdpdGhpbiBcIik7Xy5iKF8udihfLmYoXCJudW1TYW5jdHVhcmllc1wiLGMscCwwKSkpO18uYihcIiBcIik7aWYoIV8ucyhfLmYoXCJzYW5jdHVhcnlQbHVyYWxcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJTYW5jdHVhcnlcIik7fTtpZihfLnMoXy5mKFwic2FuY3R1YXJ5UGx1cmFsXCIsYyxwLDEpLGMscCwwLDE3MCwxODEsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIlNhbmN0dWFyaWVzXCIpO30pO2MucG9wKCk7fV8uYihcIjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+SGFiaXRhdDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+UGVyY2VudCBvZiBUb3RhbCBIYWJpdGF0PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5NZWV0cyAzMyUgZ29hbDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJzYW5jdHVhcnlIYWJpdGF0XCIsYyxwLDEpLGMscCwwLDQwMyw2MTYsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0ciBjbGFzcz1cXFwiXCIpO2lmKF8ucyhfLmYoXCJtZWV0c0dvYWxcIixjLHAsMSksYyxwLDAsNDM1LDQ0MixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwibWV0R29hbFwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkhhYlR5cGVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIgJTwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO2lmKF8ucyhfLmYoXCJtZWV0c0dvYWxcIixjLHAsMSksYyxwLDAsNTQ1LDU0OCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwieWVzXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwibWVldHNHb2FsXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwibm9cIik7fTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgUGVyY2VudGFnZXMgc2hvd24gcmVwcmVzZW50IHRoZSBwcm9wb3J0aW9uIG9mIGhhYml0YXRzIGF2YWlsYWJsZSBpbiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgQmFyYnVkYSdzIGVudGlyZSAzIG5hdXRpY2FsIG1pbGUgYm91bmRhcnkgY2FwdHVyZWQgd2l0aGluIHNhbmN0dWFyaWVzLiA8YnI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjUzM2RkZjg2YTQ5ODg2N2M1NmM2YzgzMFxcXCI+c2hvdyBoYWJpdGF0cyBsYXllcjwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImFxdWFjdWx0dXJlQXJlYXNcIixjLHAsMSksYyxwLDAsOTU4LDE1ODgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkhhYml0YXRzIHdpdGhpbiBcIik7Xy5iKF8udihfLmYoXCJudW1BcXVhY3VsdHVyZVwiLGMscCwwKSkpO18uYihcIiBBcXVhY3VsdHVyZSBBcmVhXCIpO2lmKF8ucyhfLmYoXCJhcXVhUGx1cmFsXCIsYyxwLDEpLGMscCwwLDEwNzQsMTA3NSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic1wiKTt9KTtjLnBvcCgpO31fLmIoXCI8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkhhYml0YXQ8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPlBlcmNlbnQgb2YgVG90YWwgSGFiaXRhdDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJhcXVhY3VsdHVyZUhhYml0YXRcIixjLHAsMSksYyxwLDAsMTI2MiwxMzUyLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiSGFiVHlwZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiAlPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwhLS0gICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgUGVyY2VudGFnZXMgc2hvd24gcmVwcmVzZW50IHRoZSBwcm9wb3J0aW9uIG9mIGhhYml0YXRzIGF2YWlsYWJsZSBpbiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgQmFyYnVkYSdzIGVudGlyZSAzIG5hdXRpY2FsIG1pbGUgYm91bmRhcnkgY2FwdHVyZWQgd2l0aGluIGFxdWFjdWx0dXJlIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBhcmVhcy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD4gLS0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJtb29yaW5nc1wiLGMscCwxKSxjLHAsMCwxNjI0LDIyMzUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkhhYml0YXRzIHdpdGhpbiBcIik7Xy5iKF8udihfLmYoXCJudW1Nb29yaW5nc1wiLGMscCwwKSkpO18uYihcIiBNb29yaW5nIEFyZWFcIik7aWYoXy5zKF8uZihcIm1vb3JpbmdQbHVyYWxcIixjLHAsMSksYyxwLDAsMTczNiwxNzM3LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzXCIpO30pO2MucG9wKCk7fV8uYihcIjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+SGFiaXRhdDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+UGVyY2VudCBvZiBUb3RhbCBIYWJpdGF0PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcIm1vb3JpbmdEYXRhXCIsYyxwLDEpLGMscCwwLDE5MjAsMjAxMCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkhhYlR5cGVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIgJTwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8IS0tICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFBlcmNlbnRhZ2VzIHNob3duIHJlcHJlc2VudCB0aGUgcHJvcG9ydGlvbiBvZiBoYWJpdGF0cyBhdmFpbGFibGUgaW4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIEJhcmJ1ZGEncyBlbnRpcmUgMyBuYXV0aWNhbCBtaWxlIGJvdW5kYXJ5IGNhcHR1cmVkIHdpdGhpbiBtb29yaW5nIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBhcmVhcy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD4gLS0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJmaXNoaW5nQXJlYXNcIixjLHAsMSksYyxwLDAsMjI2NywyOTE2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5IYWJpdGF0cyB3aXRoaW4gXCIpO18uYihfLnYoXy5mKFwibnVtRmlzaGluZ0FyZWFzXCIsYyxwLDApKSk7Xy5iKFwiIEZpc2hpbmcgUHJpb3JpdHkgQXJlYVwiKTtpZihfLnMoXy5mKFwiZmlzaGluZ0FyZWFQbHVyYWxcIixjLHAsMSksYyxwLDAsMjM5NiwyMzk3LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzXCIpO30pO2MucG9wKCk7fV8uYihcIjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+SGFiaXRhdDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+UGVyY2VudCBvZiBUb3RhbCBIYWJpdGF0PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImZpc2hpbmdBcmVhRGF0YVwiLGMscCwxKSxjLHAsMCwyNTg4LDI2NzgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJIYWJUeXBlXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJQZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiICU8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8IS0tIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBQZXJjZW50YWdlcyBzaG93biByZXByZXNlbnQgdGhlIHByb3BvcnRpb24gb2YgaGFiaXRhdHMgYXZhaWxhYmxlIGluIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBCYXJidWRhJ3MgZW50aXJlIDMgbmF1dGljYWwgbWlsZSBib3VuZGFyeSBjYXB0dXJlZCB3aXRoaW4gZmlzaGluZyBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgcHJpb3JpdHkgYXJlYXMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+IC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaGFzTm9OZXRab25lc1wiLGMscCwxKSxjLHAsMCwyOTUzLDM1NzEsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkhhYml0YXRzIHdpdGhpbiBcIik7Xy5iKF8udihfLmYoXCJudW1Ob05ldFpvbmVzXCIsYyxwLDApKSk7Xy5iKFwiIE5vIE5ldCBab25lXCIpO2lmKF8ucyhfLmYoXCJub05ldFpvbmVzUGx1cmFsXCIsYyxwLDEpLGMscCwwLDMwNjksMzA3MCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic1wiKTt9KTtjLnBvcCgpO31fLmIoXCI8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkhhYml0YXQ8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPlBlcmNlbnQgb2YgVG90YWwgSGFiaXRhdDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJub05ldFpvbmVzRGF0YVwiLGMscCwxKSxjLHAsMCwzMjU5LDMzNDksXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJIYWJUeXBlXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJQZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiICU8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8IS0tIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBQZXJjZW50YWdlcyBzaG93biByZXByZXNlbnQgdGhlIHByb3BvcnRpb24gb2YgaGFiaXRhdHMgYXZhaWxhYmxlIGluIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBCYXJidWRhJ3MgZW50aXJlIDMgbmF1dGljYWwgbWlsZSBib3VuZGFyeSBjYXB0dXJlZCB3aXRoaW4gbm8gbmV0IHpvbmVzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPiAtLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fXJldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcImFycmF5T3ZlcnZpZXdcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7aWYoXy5zKF8uZChcInNrZXRjaENsYXNzLmRlbGV0ZWRcIixjLHAsMSksYyxwLDAsMjQsMjcwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJhbGVydCBhbGVydC13YXJuXFxcIiBzdHlsZT1cXFwibWFyZ2luLWJvdHRvbToxMHB4O1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBUaGlzIHNrZXRjaCB3YXMgY3JlYXRlZCB1c2luZyB0aGUgXFxcIlwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCJcXFwiIHRlbXBsYXRlLCB3aGljaCBpc1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgbm8gbG9uZ2VyIGF2YWlsYWJsZS4gWW91IHdpbGwgbm90IGJlIGFibGUgdG8gY29weSB0aGlzIHNrZXRjaCBvciBtYWtlIG5ld1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgc2tldGNoZXMgb2YgdGhpcyB0eXBlLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHNpemVcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlNpemU8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJoYXNTa2V0Y2hlc1wiLGMscCwxKSxjLHAsMCwzNjMsODc0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhpcyBjb2xsZWN0aW9uIGlzIGNvbXBvc2VkIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibnVtU2tldGNoZXNcIixjLHAsMCkpKTtfLmIoXCIgem9uZVwiKTtpZihfLnMoXy5mKFwic2tldGNoZXNQbHVyYWxcIixjLHAsMSksYyxwLDAsNDY4LDQ2OSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic1wiKTt9KTtjLnBvcCgpO31fLmIoXCI8L3N0cm9uZz4gaW4gYm90aCBvY2VhbiBhbmQgbGFnb29uIHdhdGVycy4gVGhlIGNvbGxlY3Rpb24gaW5jbHVkZXMgYSB0b3RhbCA8ZW0+b2NlYW5pYzwvZW0+IGFyZWEgb2YgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJzdW1PY2VhbkFyZWFcIixjLHAsMCkpKTtfLmIoXCIgc3F1YXJlIG1pbGVzPC9zdHJvbmc+LCB3aGljaCByZXByZXNlbnRzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwic3VtT2NlYW5QZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiBCYXJidWRhJ3Mgd2F0ZXJzLiBJdCBhbHNvIGluY29ycG9yYXRlcyBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJzdW1MYWdvb25BcmVhXCIsYyxwLDApKSk7Xy5iKFwiIHNxdWFyZSBtaWxlczwvc3Ryb25nPiwgb3IgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJzdW1MYWdvb25QZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiwgb2YgdGhlIHRvdGFsIDxlbT5sYWdvb24gYXJlYTwvZW0+LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoXy5zKF8uZihcImhhc1NhbmN0dWFyaWVzXCIsYyxwLDEpLGMscCwwLDkxNCwxNjUzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhlIGNvbGxlY3Rpb24gaW5jbHVkZXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJudW1TYW5jdHVhcmllc1wiLGMscCwwKSkpO18uYihcIiBcIik7aWYoIV8ucyhfLmYoXCJzYW5jdHVhcmllc1BsdXJhbFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcInNhbmN0dWFyeVwiKTt9O2lmKF8ucyhfLmYoXCJzYW5jdHVhcmllc1BsdXJhbFwiLGMscCwxKSxjLHAsMCwxMDY3LDEwNzgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInNhbmN0dWFyaWVzXCIpO30pO2MucG9wKCk7fV8uYihcIjwvc3Ryb25nPiBpbiBib3RoIG9jZWFuIGFuZCBsYWdvb24gd2F0ZXJzLiBUaGUgXCIpO2lmKCFfLnMoXy5mKFwic2FuY3R1YXJpZXNQbHVyYWxcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJzYW5jdHVhcnlcIik7fTtpZihfLnMoXy5mKFwic2FuY3R1YXJpZXNQbHVyYWxcIixjLHAsMSksYyxwLDAsMTIyMiwxMjMzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzYW5jdHVhcmllc1wiKTt9KTtjLnBvcCgpO31fLmIoXCIgY29udGFpblwiKTtpZighXy5zKF8uZihcInNhbmN0dWFyaWVzUGx1cmFsXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwic1wiKTt9O18uYihcIiBhIHRvdGFsIDxlbT5vY2VhbmljPC9lbT4gYXJlYSBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInNhbmN0dWFyeU9jZWFuQXJlYVwiLGMscCwwKSkpO18uYihcIiBzcXVhcmUgbWlsZXM8L3N0cm9uZz4sIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICB3aGljaCByZXByZXNlbnRzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwic2FuY3R1YXJ5T2NlYW5QZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiBCYXJidWRhJ3Mgd2F0ZXJzLiBJdCBhbHNvIGluY2x1ZGVzIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInNhbmN0dWFyeUxhZ29vbkFyZWFcIixjLHAsMCkpKTtfLmIoXCIgc3F1YXJlIG1pbGVzPC9zdHJvbmc+LCBvciA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInNhbmN0dWFyeUxhZ29vblBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+LCBvZiB0aGUgdG90YWwgPGVtPmxhZ29vbiBhcmVhPC9lbT4uXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZihfLnMoXy5mKFwiaGFzTm9OZXRab25lc1wiLGMscCwxKSxjLHAsMCwxNjkzLDIzMjksXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGUgY29sbGVjdGlvbiBpbmNsdWRlcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm51bU5vTmV0Wm9uZXNcIixjLHAsMCkpKTtfLmIoXCIgTm8gTmV0IFpvbmVcIik7aWYoXy5zKF8uZihcIm5vTmV0Wm9uZXNQbHVyYWxcIixjLHAsMSksYyxwLDAsMTgwMiwxODAzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzXCIpO30pO2MucG9wKCk7fV8uYihcIjwvc3Ryb25nPiBpbiBib3RoIG9jZWFuIGFuZCBsYWdvb24gd2F0ZXJzLiBUaGUgTm8gTmV0IFpvbmVcIik7aWYoXy5zKF8uZihcIm5vTmV0Wm9uZXNQbHVyYWxcIixjLHAsMSksYyxwLDAsMTkwMywxOTA0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzXCIpO30pO2MucG9wKCk7fV8uYihcIjwvc3Ryb25nPiBjb250YWluXCIpO2lmKCFfLnMoXy5mKFwibm9OZXRab25lc1BsdXJhbFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcInNcIik7fTtfLmIoXCIgYSB0b3RhbCA8ZW0+b2NlYW5pYzwvZW0+IGFyZWEgb2YgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJub05ldFpvbmVzT2NlYW5BcmVhXCIsYyxwLDApKSk7Xy5iKFwiIHNxdWFyZSBtaWxlczwvc3Ryb25nPiwgd2hpY2ggcmVwcmVzZW50cyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm5vTmV0Wm9uZXNPY2VhblBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIEJhcmJ1ZGEncyB3YXRlcnMuIEl0IGFsc28gaW5jbHVkZXMgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibm9OZXRab25lc0xhZ29vbkFyZWFcIixjLHAsMCkpKTtfLmIoXCIgc3F1YXJlIG1pbGVzPC9zdHJvbmc+LCBvciA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm5vTmV0Wm9uZXNMYWdvb25QZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiwgb2YgdGhlIHRvdGFsIDxlbT5sYWdvb24gYXJlYTwvZW0+LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoXy5zKF8uZihcImhhc01vb3JpbmdzXCIsYyxwLDEpLGMscCwwLDIzNjYsMjk3OCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoZSBjb2xsZWN0aW9uIGluY2x1ZGVzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibnVtTW9vcmluZ3NcIixjLHAsMCkpKTtfLmIoXCIgTW9vcmluZyBBcmVhXCIpO2lmKF8ucyhfLmYoXCJtb29yaW5nc1BsdXJhbFwiLGMscCwxKSxjLHAsMCwyNDcyLDI0NzMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9zdHJvbmc+IGluIGJvdGggb2NlYW4gYW5kIGxhZ29vbiB3YXRlcnMuIFRoZSBNb29yaW5nIEFyZWFcIik7aWYoXy5zKF8uZihcIm1vb3JpbmdzUGx1cmFsXCIsYyxwLDEpLGMscCwwLDI1NzAsMjU3MSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic1wiKTt9KTtjLnBvcCgpO31fLmIoXCIgY29udGFpblwiKTtpZighXy5zKF8uZihcIm1vb3JpbmdzUGx1cmFsXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwic1wiKTt9O18uYihcIiBhIHRvdGFsIDxlbT5vY2VhbmljPC9lbT4gYXJlYSBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm1vb3JpbmdzT2NlYW5BcmVhXCIsYyxwLDApKSk7Xy5iKFwiIHNxdWFyZSBtaWxlczwvc3Ryb25nPiwgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIHdoaWNoIHJlcHJlc2VudHMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJtb29yaW5nc09jZWFuUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgQmFyYnVkYSdzIHdhdGVycy4gSXQgYWxzbyBpbmNsdWRlcyBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJtb29yaW5nc0xhZ29vbkFyZWFcIixjLHAsMCkpKTtfLmIoXCIgc3F1YXJlIG1pbGVzPC9zdHJvbmc+LCBvciA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm1vb3JpbmdzTGFnb29uUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4sIG9mIHRoZSB0b3RhbCA8ZW0+bGFnb29uIGFyZWE8L2VtPi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKF8ucyhfLmYoXCJoYXNBcXVhY3VsdHVyZVwiLGMscCwxKSxjLHAsMCwzMDE2LDM2NjQsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGUgY29sbGVjdGlvbiBpbmNsdWRlcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm51bUFxdWFjdWx0dXJlXCIsYyxwLDApKSk7Xy5iKFwiIEFxdWFjdWx0dXJlIEFyZWFcIik7aWYoXy5zKF8uZihcImFxdWFjdWx0dXJlUGx1cmFsXCIsYyxwLDEpLGMscCwwLDMxMzIsMzEzMyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic1wiKTt9KTtjLnBvcCgpO31fLmIoXCI8L3N0cm9uZz4gaW4gYm90aCBvY2VhbiBhbmQgbGFnb29uIHdhdGVycy4gVGhlIEFxdWFjdWx0dXJlIEFyZWFcIik7aWYoXy5zKF8uZihcImFxdWFjdWx0dXJlUGx1cmFsXCIsYyxwLDEpLGMscCwwLDMyNDAsMzI0MSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic1wiKTt9KTtjLnBvcCgpO31fLmIoXCIgY29udGFpblwiKTtpZighXy5zKF8uZihcImFxdWFjdWx0dXJlUGx1cmFsXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwic1wiKTt9O18uYihcIiBhIHRvdGFsIDxlbT5vY2VhbmljPC9lbT4gYXJlYSBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImFxdWFjdWx0dXJlT2NlYW5BcmVhXCIsYyxwLDApKSk7Xy5iKFwiIHNxdWFyZSBtaWxlczwvc3Ryb25nPiwgd2hpY2ggcmVwcmVzZW50cyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImFxdWFjdWx0dXJlT2NlYW5QZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiBCYXJidWRhJ3Mgd2F0ZXJzLiBJdCBhbHNvIGluY2x1ZGVzIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImFxdWFjdWx0dXJlTGFnb29uQXJlYVwiLGMscCwwKSkpO18uYihcIiBzcXVhcmUgbWlsZXM8L3N0cm9uZz4sIG9yIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiYXF1YWN1bHR1cmVMYWdvb25QZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiwgb2YgdGhlIHRvdGFsIDxlbT5sYWdvb24gYXJlYTwvZW0+LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoXy5zKF8uZihcImhhc0Zpc2hpbmdBcmVhc1wiLGMscCwxKSxjLHAsMCwzNzA2LDQzNzUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGUgY29sbGVjdGlvbiBpbmNsdWRlcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm51bUZpc2hpbmdBcmVhc1wiLGMscCwwKSkpO18uYihcIiBGaXNoaW5nIFByaW9yaXR5IEFyZWFcIik7aWYoXy5zKF8uZihcImZpc2hpbmdBcmVhc1BsdXJhbFwiLGMscCwxKSxjLHAsMCwzODI5LDM4MzAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9zdHJvbmc+IGluIGJvdGggb2NlYW4gYW5kIGxhZ29vbiB3YXRlcnMuIFRoZSBGaXNoaW5nIFByaW9yaXR5IEFyZWFcIik7aWYoXy5zKF8uZihcImZpc2hpbmdBcmVhc1BsdXJhbFwiLGMscCwxKSxjLHAsMCwzOTQ0LDM5NDUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiIGNvbnRhaW5cIik7aWYoIV8ucyhfLmYoXCJmaXNoaW5nQXJlYXNQbHVyYWxcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJzXCIpO307Xy5iKFwiIGEgdG90YWwgPGVtPm9jZWFuaWM8L2VtPiBhcmVhIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiZmlzaGluZ0FyZWFzT2NlYW5BcmVhXCIsYyxwLDApKSk7Xy5iKFwiIHNxdWFyZSBtaWxlczwvc3Ryb25nPiwgd2hpY2ggcmVwcmVzZW50cyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImZpc2hpbmdBcmVhc09jZWFuUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgQmFyYnVkYSdzIHdhdGVycy4gSXQgYWxzbyBpbmNsdWRlcyBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJmaXNoaW5nQXJlYXNMYWdvb25BcmVhXCIsYyxwLDApKSk7Xy5iKFwiIHNxdWFyZSBtaWxlczwvc3Ryb25nPiwgb3IgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJmaXNoaW5nQXJlYXNMYWdvb25QZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiwgb2YgdGhlIHRvdGFsIDxlbT5sYWdvb24gYXJlYTwvZW0+LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPCEtLVwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlpvbmVzIGluIHRoaXMgUHJvcG9zYWw8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGRpdiBjbGFzcz1cXFwidG9jQ29udGFpbmVyXFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCItLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiYW55QXR0cmlidXRlc1wiLGMscCwxKSxjLHAsMCw0NTM0LDQ2NTgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCIgQXR0cmlidXRlczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKF8ucnAoXCJhdHRyaWJ1dGVzL2F0dHJpYnV0ZXNUYWJsZVwiLGMscCxcIiAgXCIpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31yZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJhcnJheVRyYWRlb2Zmc1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5UcmFkZW9mZnM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0PHAgY2xhc3M9XFxcInNtYWxsIHR0aXAtdGlwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdCAgIFRpcDogaG92ZXIgb3ZlciBhIHByb3Bvc2FsIHRvIHNlZSBkZXRhaWxzXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQ8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdDxkaXYgIGlkPVxcXCJ0cmFkZW9mZi1jaGFydFxcXCIgY2xhc3M9XFxcInRyYWRlb2ZmLWNoYXJ0XFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiZGVtb1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5SZXBvcnQgU2VjdGlvbnM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+VXNlIHJlcG9ydCBzZWN0aW9ucyB0byBncm91cCBpbmZvcm1hdGlvbiBpbnRvIG1lYW5pbmdmdWwgY2F0ZWdvcmllczwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkQzIFZpc3VhbGl6YXRpb25zPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx1bCBjbGFzcz1cXFwibmF2IG5hdi1waWxsc1xcXCIgaWQ9XFxcInRhYnMyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGxpIGNsYXNzPVxcXCJhY3RpdmVcXFwiPjxhIGhyZWY9XFxcIiNjaGFydFxcXCI+Q2hhcnQ8L2E+PC9saT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGxpPjxhIGhyZWY9XFxcIiNkYXRhVGFibGVcXFwiPlRhYmxlPC9hPjwvbGk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3VsPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGRpdiBjbGFzcz1cXFwidGFiLWNvbnRlbnRcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJ0YWItcGFuZSBhY3RpdmVcXFwiIGlkPVxcXCJjaGFydFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPCEtLVtpZiBJRSA4XT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8cCBjbGFzcz1cXFwidW5zdXBwb3J0ZWRcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIFRoaXMgdmlzdWFsaXphdGlvbiBpcyBub3QgY29tcGF0aWJsZSB3aXRoIEludGVybmV0IEV4cGxvcmVyIDguIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIFBsZWFzZSB1cGdyYWRlIHlvdXIgYnJvd3Nlciwgb3IgdmlldyByZXN1bHRzIGluIHRoZSB0YWJsZSB0YWIuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9wPiAgICAgIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwhW2VuZGlmXS0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgU2VlIDxjb2RlPnNyYy9zY3JpcHRzL2RlbW8uY29mZmVlPC9jb2RlPiBmb3IgYW4gZXhhbXBsZSBvZiBob3cgdG8gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICB1c2UgZDMuanMgdG8gcmVuZGVyIHZpc3VhbGl6YXRpb25zLiBQcm92aWRlIGEgdGFibGUtYmFzZWQgdmlld1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgYW5kIHVzZSBjb25kaXRpb25hbCBjb21tZW50cyB0byBwcm92aWRlIGEgZmFsbGJhY2sgZm9yIElFOCB1c2Vycy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxicj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxhIGhyZWY9XFxcImh0dHA6Ly90d2l0dGVyLmdpdGh1Yi5pby9ib290c3RyYXAvMi4zLjIvXFxcIj5Cb290c3RyYXAgMi54PC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgaXMgbG9hZGVkIHdpdGhpbiBTZWFTa2V0Y2ggc28geW91IGNhbiB1c2UgaXQgdG8gY3JlYXRlIHRhYnMgYW5kIG90aGVyIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgaW50ZXJmYWNlIGNvbXBvbmVudHMuIGpRdWVyeSBhbmQgdW5kZXJzY29yZSBhcmUgYWxzbyBhdmFpbGFibGUuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwidGFiLXBhbmVcXFwiIGlkPVxcXCJkYXRhVGFibGVcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5pbmRleDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPnZhbHVlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImNoYXJ0RGF0YVwiLGMscCwxKSxjLHAsMCwxMzUxLDE0MTgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICA8dHI+PHRkPlwiKTtfLmIoXy52KF8uZihcImluZGV4XCIsYyxwLDApKSk7Xy5iKFwiPC90ZD48dGQ+XCIpO18uYihfLnYoXy5mKFwidmFsdWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPjwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gZW1waGFzaXNcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkVtcGhhc2lzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPkdpdmUgcmVwb3J0IHNlY3Rpb25zIGFuIDxjb2RlPmVtcGhhc2lzPC9jb2RlPiBjbGFzcyB0byBoaWdobGlnaHQgaW1wb3J0YW50IGluZm9ybWF0aW9uLjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gd2FybmluZ1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+V2FybmluZzwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5PciA8Y29kZT53YXJuPC9jb2RlPiBvZiBwb3RlbnRpYWwgcHJvYmxlbXMuPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiBkYW5nZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkRhbmdlcjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD48Y29kZT5kYW5nZXI8L2NvZGU+IGNhbiBhbHNvIGJlIHVzZWQuLi4gc3BhcmluZ2x5LjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiZmlzaGluZ1ByaW9yaXR5QXJlYVwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5GaXNoaW5nIFZhbHVlPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoaXMgZmlzaGluZyBwcmlvcml0eSBhcmVhIGluY2x1ZGVzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwicGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgdGhlIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBmaXNoaW5nIHZhbHVlIHdpdGhpbiBCYXJidWRhJ3Mgd2F0ZXJzLCBiYXNlZCBvbiB1c2VyIHJlcG9ydGVkIHZhbHVlcyBvZiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgZmlzaGluZyBncm91bmRzXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MzNmMTZmNmE0OTg4NjdjNTZjNmZiNTdcXFwiPnNob3cgZmlzaGluZyB2YWx1ZXMgbGF5ZXI8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJmaXNoaW5nVmFsdWVcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RmlzaGluZyBWYWx1ZTwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGlzIFwiKTtfLmIoXy52KF8uZihcImFyZWFMYWJlbFwiLGMscCwwKSkpO18uYihcIiBkaXNwbGFjZXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJwZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgb2YgdGhlIGZpc2hpbmcgdmFsdWUgd2l0aGluIEJhcmJ1ZGHigJlzIHdhdGVycywgYmFzZWQgb24gdXNlciByZXBvcnRlZFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICB2YWx1ZXMgb2YgZmlzaGluZyBncm91bmRzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTMzZjE2ZjZhNDk4ODY3YzU2YzZmYjU3XFxcIj5zaG93IGZpc2hpbmcgdmFsdWVzIGxheWVyPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiaGFiaXRhdFwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5cIik7Xy5iKF8udihfLmYoXCJoZWFkaW5nXCIsYyxwLDApKSk7Xy5iKFwiPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5IYWJpdGF0PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD4lIG9mIFRvdGFsIEhhYml0YXQ8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaGFiaXRhdHNcIixjLHAsMSksYyxwLDAsMjE2LDI3OSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPjx0ZD5cIik7Xy5iKF8udihfLmYoXCJIYWJUeXBlXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD48dGQ+XCIpO18uYihfLnYoXy5mKFwiUGVyY2VudFwiLGMscCwwKSkpO18uYihcIjwvdGQ+PC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBQZXJjZW50YWdlcyBzaG93biByZXByZXNlbnQgdGhlIHByb3BvcnRpb24gb2YgaGFiaXRhdHMgYXZhaWxhYmxlIGluIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBCYXJidWRhJ3MgZW50aXJlIDMgbmF1dGljYWwgbWlsZSBib3VuZGFyeSBjYXB0dXJlZCB3aXRoaW4gdGhpcyB6b25lLiA8YnI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjUzM2RkZjg2YTQ5ODg2N2M1NmM2YzgzMFxcXCI+c2hvdyBoYWJpdGF0cyBsYXllcjwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm92ZXJ2aWV3XCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO2lmKF8ucyhfLmQoXCJza2V0Y2hDbGFzcy5kZWxldGVkXCIsYyxwLDEpLGMscCwwLDI0LDI3MCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwiYWxlcnQgYWxlcnQtd2FyblxcXCIgc3R5bGU9XFxcIm1hcmdpbi1ib3R0b206MTBweDtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgVGhpcyBza2V0Y2ggd2FzIGNyZWF0ZWQgdXNpbmcgdGhlIFxcXCJcIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiB0ZW1wbGF0ZSwgd2hpY2ggaXNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIG5vIGxvbmdlciBhdmFpbGFibGUuIFlvdSB3aWxsIG5vdCBiZSBhYmxlIHRvIGNvcHkgdGhpcyBza2V0Y2ggb3IgbWFrZSBuZXdcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIHNrZXRjaGVzIG9mIHRoaXMgdHlwZS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiBzaXplXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5TaXplPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoaXMgYXJlYSBpcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIlNRX01JTEVTXCIsYyxwLDApKSk7Xy5iKFwiIHNxdWFyZSBtaWxlczwvc3Ryb25nPixcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgd2hpY2ggcmVwcmVzZW50cyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIlBFUkNFTlRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIEJhcmJ1ZGEncyB3YXRlcnMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwicmVuZGVyTWluaW11bVdpZHRoXCIsYyxwLDEpLGMscCwwLDUzNiwxMTc4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIGRpYW1ldGVyIFwiKTtpZighXy5zKF8uZihcIkRJQU1fT0tcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJ3YXJuaW5nXCIpO307Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5NaW5pbXVtIFdpZHRoPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoZSBtaW5pbXVtIHdpZHRoIG9mIGEgem9uZSBzaWduaWZpY2FudGx5IGltcGFjdHMgIGl0cyBjb25zZXJ2YXRpb24gdmFsdWUuIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGUgcmVjb21tZW5kZWQgc21hbGxlc3QgZGlhbWV0ZXIgaXMgYmV0d2VlbiAyIGFuZCAzIG1pbGVzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8c3Ryb25nPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKCFfLnMoXy5mKFwiRElBTV9PS1wiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgICBUaGlzIGRlc2lnbiBmYWxscyBvdXRzaWRlIHRoZSByZWNvbW1lbmRhdGlvbiBhdCBcIik7Xy5iKF8udihfLmYoXCJESUFNXCIsYyxwLDApKSk7Xy5iKFwiIG1pbGVzLlwiKTtfLmIoXCJcXG5cIik7fTtpZihfLnMoXy5mKFwiRElBTV9PS1wiLGMscCwxKSxjLHAsMCw5MjYsOTk3LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgVGhpcyBkZXNpZ24gZml0cyB3aXRoaW4gdGhlIHJlY29tbWVuZGF0aW9uIGF0IFwiKTtfLmIoXy52KF8uZihcIkRJQU1cIixjLHAsMCkpKTtfLmIoXCIgbWlsZXMuXCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC9zdHJvbmc+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJ2aXpcXFwiIHN0eWxlPVxcXCJwb3NpdGlvbjpyZWxhdGl2ZTtcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGltZyBzcmM9XFxcImh0dHA6Ly9zMy5hbWF6b25hd3MuY29tL1NlYVNrZXRjaC9wcm9qZWN0cy9iYXJidWRhL21pbl93aWR0aF9leGFtcGxlLnBuZ1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJhbnlBdHRyaWJ1dGVzXCIsYyxwLDEpLGMscCwwLDEyMjEsMTM0NSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+XCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIiBBdHRyaWJ1dGVzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXy5ycChcImF0dHJpYnV0ZXMvYXR0cmlidXRlc1RhYmxlXCIsYyxwLFwiICBcIikpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fXJldHVybiBfLmZsKCk7O30pO1xuXG5pZih0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gdGhpc1tcIlRlbXBsYXRlc1wiXTtcbn0iXX0=
