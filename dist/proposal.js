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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL3RyYWluaW5nLXJlcG9ydHMtdjIvbm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvdHJhaW5pbmctcmVwb3J0cy12Mi9ub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9saWIvX2VtcHR5LmpzIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL2VuYWJsZUxheWVyVG9nZ2xlcnMuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL2pvYkl0ZW0uY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL3JlcG9ydFJlc3VsdHMuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL3JlcG9ydFRhYi5jb2ZmZWUiLCIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL3RyYWluaW5nLXJlcG9ydHMtdjIvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvdXRpbHMuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL3NjcmlwdHMvYXJyYXlGaXNoaW5nVmFsdWVUYWIuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL3NjcmlwdHMvYXJyYXlIYWJpdGF0VGFiLmNvZmZlZSIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvdHJhaW5pbmctcmVwb3J0cy12Mi9zY3JpcHRzL2FycmF5T3ZlcnZpZXdUYWIuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL3NjcmlwdHMvYXJyYXlUcmFkZW9mZnMuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi90cmFpbmluZy1yZXBvcnRzLXYyL3NjcmlwdHMvaWRzLmNvZmZlZSIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvdHJhaW5pbmctcmVwb3J0cy12Mi9zY3JpcHRzL3Byb3Bvc2FsLmNvZmZlZSIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvdHJhaW5pbmctcmVwb3J0cy12Mi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7O0FDQUEsQ0FBTyxDQUFVLENBQUEsR0FBWCxDQUFOLEVBQWtCO0NBQ2hCLEtBQUEsMkVBQUE7Q0FBQSxDQUFBLENBQUE7Q0FBQSxDQUNBLENBQUEsR0FBWTtDQURaLENBRUEsQ0FBQSxHQUFNO0FBQ0MsQ0FBUCxDQUFBLENBQUEsQ0FBQTtDQUNFLEVBQUEsQ0FBQSxHQUFPLHFCQUFQO0NBQ0EsU0FBQTtJQUxGO0NBQUEsQ0FNQSxDQUFXLENBQUEsSUFBWCxhQUFXO0NBRVg7Q0FBQSxNQUFBLG9DQUFBO3dCQUFBO0NBQ0UsRUFBVyxDQUFYLEdBQVcsQ0FBWDtDQUFBLEVBQ1MsQ0FBVCxFQUFBLEVBQWlCLEtBQVI7Q0FDVDtDQUNFLEVBQU8sQ0FBUCxFQUFBLFVBQU87Q0FBUCxFQUNPLENBQVAsQ0FEQSxDQUNBO0FBQytCLENBRi9CLENBRThCLENBQUUsQ0FBaEMsRUFBQSxFQUFRLENBQXdCLEtBQWhDO0NBRkEsQ0FHeUIsRUFBekIsRUFBQSxFQUFRLENBQVI7TUFKRjtDQU1FLEtBREk7Q0FDSixDQUFnQyxFQUFoQyxFQUFBLEVBQVEsUUFBUjtNQVRKO0NBQUEsRUFSQTtDQW1CUyxDQUFULENBQXFCLElBQXJCLENBQVEsQ0FBUjtDQUNFLEdBQUEsVUFBQTtDQUFBLEVBQ0EsQ0FBQSxFQUFNO0NBRE4sRUFFTyxDQUFQLEtBQU87Q0FDUCxHQUFBO0NBQ0UsR0FBSSxFQUFKLFVBQUE7QUFDMEIsQ0FBdEIsQ0FBcUIsQ0FBdEIsQ0FBSCxDQUFxQyxJQUFWLElBQTNCLENBQUE7TUFGRjtDQUlTLEVBQXFFLENBQUEsQ0FBNUUsUUFBQSx5REFBTztNQVJVO0NBQXJCLEVBQXFCO0NBcEJOOzs7O0FDQWpCLElBQUEsR0FBQTtHQUFBO2tTQUFBOztBQUFNLENBQU47Q0FDRTs7Q0FBQSxFQUFXLE1BQVgsS0FBQTs7Q0FBQSxDQUFBLENBQ1EsR0FBUjs7Q0FEQSxFQUdFLEtBREY7Q0FDRSxDQUNFLEVBREYsRUFBQTtDQUNFLENBQVMsSUFBVCxDQUFBLE1BQUE7Q0FBQSxDQUNZLEVBRFosRUFDQSxJQUFBO0NBREEsQ0FFWSxJQUFaLElBQUE7U0FBYTtDQUFBLENBQ0wsRUFBTixFQURXLElBQ1g7Q0FEVyxDQUVGLEtBQVQsR0FBQSxFQUZXO1VBQUQ7UUFGWjtNQURGO0NBQUEsQ0FRRSxFQURGLFFBQUE7Q0FDRSxDQUFTLElBQVQsQ0FBQSxDQUFTLEdBQUE7Q0FBVCxDQUNTLENBQUEsR0FBVCxDQUFBLEVBQVM7Q0FDUCxHQUFBLFFBQUE7Q0FBQyxFQUFELENBQUMsQ0FBSyxHQUFOLEVBQUE7Q0FGRixNQUNTO0NBRFQsQ0FHWSxFQUhaLEVBR0EsSUFBQTtDQUhBLENBSU8sQ0FBQSxFQUFQLENBQUEsR0FBTztDQUNMLEVBQUcsQ0FBQSxDQUFNLEdBQVQsR0FBRztDQUNELEVBQW9CLENBQVEsQ0FBSyxDQUFiLENBQUEsR0FBYixDQUFvQixNQUFwQjtNQURULElBQUE7Q0FBQSxnQkFHRTtVQUpHO0NBSlAsTUFJTztNQVpUO0NBQUEsQ0FrQkUsRUFERixLQUFBO0NBQ0UsQ0FBUyxJQUFULENBQUEsQ0FBQTtDQUFBLENBQ08sQ0FBQSxFQUFQLENBQUEsR0FBUTtDQUNOLGVBQU87Q0FBUCxRQUFBLE1BQ087Q0FEUCxrQkFFSTtDQUZKLFFBQUEsTUFHTztDQUhQLGtCQUlJO0NBSkosU0FBQSxLQUtPO0NBTFAsa0JBTUk7Q0FOSixNQUFBLFFBT087Q0FQUCxrQkFRSTtDQVJKO0NBQUEsa0JBVUk7Q0FWSixRQURLO0NBRFAsTUFDTztNQW5CVDtDQUFBLENBZ0NFLEVBREYsVUFBQTtDQUNFLENBQVMsSUFBVCxDQUFBLE1BQUE7Q0FBQSxDQUNPLENBQUEsRUFBUCxDQUFBLEdBQVE7Q0FDTixXQUFBO0NBQUEsRUFBSyxHQUFMLEVBQUEsU0FBSztDQUNMLEVBQWMsQ0FBWCxFQUFBLEVBQUg7Q0FDRSxFQUFBLENBQUssTUFBTDtVQUZGO0NBR0EsRUFBVyxDQUFYLFdBQU87Q0FMVCxNQUNPO0NBRFAsQ0FNUyxDQUFBLEdBQVQsQ0FBQSxFQUFVO0NBQ1EsRUFBSyxDQUFkLElBQUEsR0FBUCxJQUFBO0NBUEYsTUFNUztNQXRDWDtDQUFBLENBeUNFLEVBREYsS0FBQTtDQUNFLENBQVMsSUFBVCxDQUFBO0NBQUEsQ0FDWSxFQURaLEVBQ0EsSUFBQTtDQURBLENBRVMsQ0FBQSxHQUFULENBQUEsRUFBVTtDQUNQLEVBQUQ7Q0FIRixNQUVTO0NBRlQsQ0FJTyxDQUFBLEVBQVAsQ0FBQSxHQUFRO0NBQ04sR0FBRyxJQUFILENBQUE7Q0FDTyxDQUFhLEVBQWQsS0FBSixRQUFBO01BREYsSUFBQTtDQUFBLGdCQUdFO1VBSkc7Q0FKUCxNQUlPO01BN0NUO0NBSEYsR0FBQTs7Q0FzRGEsQ0FBQSxDQUFBLEVBQUEsWUFBRTtDQUNiLEVBRGEsQ0FBRCxDQUNaO0NBQUEsR0FBQSxtQ0FBQTtDQXZERixFQXNEYTs7Q0F0RGIsRUF5RFEsR0FBUixHQUFRO0NBQ04sRUFBSSxDQUFKLG9NQUFBO0NBUUMsR0FBQSxHQUFELElBQUE7Q0FsRUYsRUF5RFE7O0NBekRSOztDQURvQixPQUFROztBQXFFOUIsQ0FyRUEsRUFxRWlCLEdBQVgsQ0FBTjs7OztBQ3JFQSxJQUFBLFNBQUE7R0FBQTs7a1NBQUE7O0FBQU0sQ0FBTjtDQUVFOztDQUFBLEVBQXdCLENBQXhCLGtCQUFBOztDQUVhLENBQUEsQ0FBQSxDQUFBLEVBQUEsaUJBQUU7Q0FDYixFQUFBLEtBQUE7Q0FBQSxFQURhLENBQUQsRUFDWjtDQUFBLEVBRHNCLENBQUQ7Q0FDckIsa0NBQUE7Q0FBQSxDQUFjLENBQWQsQ0FBQSxFQUErQixLQUFqQjtDQUFkLEdBQ0EseUNBQUE7Q0FKRixFQUVhOztDQUZiLEVBTU0sQ0FBTixLQUFNO0NBQ0osT0FBQSxJQUFBO0NBQUMsR0FBQSxDQUFELE1BQUE7Q0FBTyxDQUNJLENBQUEsR0FBVCxDQUFBLEVBQVM7Q0FDUCxXQUFBLDBCQUFBO0NBQUEsSUFBQyxDQUFELENBQUEsQ0FBQTtDQUNBO0NBQUEsWUFBQSw4QkFBQTs2QkFBQTtDQUNFLEVBQUcsQ0FBQSxDQUE2QixDQUF2QixDQUFULENBQUcsRUFBSDtBQUNTLENBQVAsR0FBQSxDQUFRLEdBQVIsSUFBQTtDQUNFLENBQStCLENBQW5CLENBQUEsQ0FBWCxHQUFELEdBQVksR0FBWixRQUFZO2NBRGQ7Q0FFQSxpQkFBQTtZQUpKO0NBQUEsUUFEQTtDQU9BLEdBQW1DLENBQUMsR0FBcEM7Q0FBQSxJQUFzQixDQUFoQixFQUFOLEVBQUEsR0FBQTtVQVBBO0NBUUEsQ0FBNkIsQ0FBaEIsQ0FBVixDQUFrQixDQUFSLENBQVYsQ0FBSCxDQUE4QjtDQUFELGdCQUFPO0NBQXZCLFFBQWdCO0NBQzFCLENBQWtCLENBQWMsRUFBaEMsQ0FBRCxDQUFBLE1BQWlDLEVBQWQsRUFBbkI7TUFERixJQUFBO0NBR0csSUFBQSxFQUFELEdBQUEsT0FBQTtVQVpLO0NBREosTUFDSTtDQURKLENBY0UsQ0FBQSxFQUFQLENBQUEsR0FBUTtDQUNOLFdBQUEsS0FBQTtDQUFBLEVBQVUsQ0FBSCxDQUFjLENBQWQsRUFBUDtDQUNFLEdBQW1CLEVBQW5CLElBQUE7Q0FDRTtDQUNFLEVBQU8sQ0FBUCxDQUFPLE9BQUEsRUFBUDtNQURGLFFBQUE7Q0FBQTtjQURGO1lBQUE7Q0FLQSxHQUFtQyxDQUFDLEdBQXBDLEVBQUE7Q0FBQSxJQUFzQixDQUFoQixFQUFOLElBQUEsQ0FBQTtZQUxBO0NBTUMsR0FDQyxDQURELEVBQUQsVUFBQSx3QkFBQTtVQVJHO0NBZEYsTUFjRTtDQWZMLEtBQ0o7Q0FQRixFQU1NOztDQU5OOztDQUYwQixPQUFROztBQW1DcEMsQ0FuQ0EsRUFtQ2lCLEdBQVgsQ0FBTixNQW5DQTs7OztBQ0FBLElBQUEsd0dBQUE7R0FBQTs7O3dKQUFBOztBQUFBLENBQUEsRUFBc0IsSUFBQSxZQUF0QixXQUFzQjs7QUFDdEIsQ0FEQSxFQUNRLEVBQVIsRUFBUSxTQUFBOztBQUNSLENBRkEsRUFFZ0IsSUFBQSxNQUFoQixXQUFnQjs7QUFDaEIsQ0FIQSxFQUdJLElBQUEsb0JBQUE7O0FBQ0osQ0FKQSxFQUtFLE1BREY7Q0FDRSxDQUFBLFdBQUEsdUNBQWlCO0NBTG5CLENBQUE7O0FBTUEsQ0FOQSxFQU1VLElBQVYsV0FBVTs7QUFDVixDQVBBLEVBT2lCLElBQUEsT0FBakIsUUFBaUI7O0FBRVgsQ0FUTjtDQVdlLENBQUEsQ0FBQSxDQUFBLFNBQUEsTUFBRTtDQUE2QixFQUE3QixDQUFEO0NBQThCLEVBQXRCLENBQUQ7Q0FBdUIsRUFBaEIsQ0FBRCxTQUFpQjtDQUE1QyxFQUFhOztDQUFiLEVBRVMsSUFBVCxFQUFTO0NBQ1AsR0FBQSxJQUFBO09BQUEsS0FBQTtDQUFBLEdBQUEsU0FBQTtDQUNFLENBQTJCLENBQXBCLENBQVAsQ0FBTyxDQUFQLEdBQTRCO0NBQzFCLFdBQUEsTUFBQTtDQUE0QixJQUFBLEVBQUE7Q0FEdkIsTUFBb0I7QUFFcEIsQ0FBUCxHQUFBLEVBQUE7Q0FDRSxFQUE0QyxDQUFDLFNBQTdDLENBQU8sd0JBQUE7UUFKWDtNQUFBO0NBTUUsR0FBRyxDQUFBLENBQUgsQ0FBRztDQUNELEVBQU8sQ0FBUCxDQUFtQixHQUFuQjtNQURGLEVBQUE7Q0FHRSxFQUFPLENBQVAsQ0FBQSxHQUFBO1FBVEo7TUFBQTtDQVVDLENBQW9CLENBQXJCLENBQVUsR0FBVyxDQUFyQixDQUFzQixFQUF0QjtDQUNVLE1BQUQsTUFBUDtDQURGLElBQXFCO0NBYnZCLEVBRVM7O0NBRlQsRUFnQkEsQ0FBSyxLQUFDO0NBQ0osSUFBQSxHQUFBO0NBQUEsQ0FBMEIsQ0FBbEIsQ0FBUixDQUFBLEVBQWMsRUFBYTtDQUNyQixFQUFBLENBQUEsU0FBSjtDQURNLElBQWtCO0NBQTFCLENBRXdCLENBQWhCLENBQVIsQ0FBQSxDQUFRLEdBQWlCO0NBQUQsR0FBVSxDQUFRLFFBQVI7Q0FBMUIsSUFBZ0I7Q0FDeEIsR0FBQSxDQUFRLENBQUw7Q0FDRCxFQUFBLENBQWEsRUFBYixDQUFPO0NBQVAsRUFDSSxDQUFILEVBQUQsS0FBQSxJQUFBLFdBQWtCO0NBQ2xCLEVBQWdDLENBQWhDLFFBQU8sY0FBQTtDQUNLLEdBQU4sQ0FBSyxDQUpiO0NBS0UsSUFBYSxRQUFOO01BTFQ7Q0FPRSxJQUFBLFFBQU87TUFYTjtDQWhCTCxFQWdCSzs7Q0FoQkwsRUE2QkEsQ0FBSyxLQUFDO0NBQ0osRUFBQSxLQUFBO0NBQUEsRUFBQSxDQUFBO0NBQ0EsRUFBRyxDQUFILEdBQUc7Q0FDQSxDQUFVLENBQVgsS0FBQSxLQUFBO01BREY7Q0FHVyxFQUFULEtBQUEsS0FBQTtNQUxDO0NBN0JMLEVBNkJLOztDQTdCTCxDQW9DYyxDQUFQLENBQUEsQ0FBUCxJQUFRLElBQUQ7Q0FDTCxFQUFBLEtBQUE7O0dBRDBCLEdBQWQ7TUFDWjtDQUFBLEVBQUEsQ0FBQTtDQUNBLEVBQUcsQ0FBSCxHQUFHO0NBQ0EsQ0FBVSxDQUFYLE1BQVksSUFBWjtDQUEwQixDQUFLLENBQVgsRUFBQSxRQUFBLEVBQUE7Q0FBcEIsTUFBVztNQURiO0NBR1EsQ0FBSyxDQUFYLEVBQUEsUUFBQTtNQUxHO0NBcENQLEVBb0NPOztDQXBDUCxFQTJDTSxDQUFOLEtBQU87Q0FDTCxFQUFBLEtBQUE7Q0FBQSxFQUFBLENBQUE7Q0FDQSxFQUFHLENBQUgsR0FBRztDQUNBLENBQVUsQ0FBWCxNQUFZLElBQVo7Q0FBd0IsRUFBRCxFQUE2QixHQUFoQyxHQUFBLElBQUE7Q0FBcEIsTUFBVztNQURiO0NBR00sRUFBRCxFQUE2QixHQUFoQyxHQUFBLEVBQUE7TUFMRTtDQTNDTixFQTJDTTs7Q0EzQ047O0NBWEY7O0FBNkRNLENBN0ROO0NBOERFOzs7Ozs7Ozs7Ozs7Q0FBQTs7Q0FBQSxFQUFNLENBQU4sU0FBQTs7Q0FBQSxDQUFBLENBQ2MsU0FBZDs7Q0FEQSxDQUdzQixDQUFWLEVBQUEsRUFBQSxFQUFFLENBQWQ7Q0FNRSxFQU5ZLENBQUQsQ0FNWDtDQUFBLEVBTm9CLENBQUQsR0FNbkI7Q0FBQSxFQUFBLENBQUEsRUFBYTtDQUFiLENBQ1ksRUFBWixFQUFBLENBQUE7Q0FEQSxDQUUyQyxDQUF0QixDQUFyQixDQUFxQixPQUFBLENBQXJCO0NBRkEsQ0FHOEIsRUFBOUIsR0FBQSxJQUFBLENBQUEsQ0FBQTtDQUhBLENBSThCLEVBQTlCLEVBQUEsTUFBQSxDQUFBLEdBQUE7Q0FKQSxDQUs4QixFQUE5QixFQUFBLElBQUEsRUFBQSxDQUFBO0NBTEEsQ0FNMEIsRUFBMUIsRUFBc0MsRUFBdEMsRUFBQSxHQUFBO0NBQ0MsQ0FBNkIsRUFBN0IsS0FBRCxFQUFBLENBQUEsQ0FBQSxFQUFBO0NBaEJGLEVBR1k7O0NBSFosRUFrQlEsR0FBUixHQUFRO0NBQ04sU0FBTSx1QkFBTjtDQW5CRixFQWtCUTs7Q0FsQlIsRUFxQk0sQ0FBTixLQUFNO0NBQ0osT0FBQSxJQUFBO0NBQUEsRUFBSSxDQUFKO0NBQUEsRUFDVyxDQUFYLEdBQUE7QUFDOEIsQ0FBOUIsR0FBQSxDQUFnQixDQUFtQyxPQUFQO0NBQ3pDLEdBQUEsU0FBRDtDQUNNLEdBQUEsQ0FBYyxDQUZ0QjtDQUdFLEdBQUMsRUFBRDtDQUNDLEVBQTBGLENBQTFGLEtBQTBGLElBQTNGLG9FQUFBO0NBQ0UsV0FBQSwwQkFBQTtDQUFBLEVBQU8sQ0FBUCxJQUFBO0NBQUEsQ0FBQSxDQUNPLENBQVAsSUFBQTtDQUNBO0NBQUEsWUFBQSwrQkFBQTsyQkFBQTtDQUNFLEVBQU0sQ0FBSCxFQUFILElBQUE7Q0FDRSxFQUFPLENBQVAsQ0FBYyxPQUFkO0NBQUEsRUFDdUMsQ0FBbkMsQ0FBUyxDQUFiLE1BQUEsa0JBQWE7WUFIakI7Q0FBQSxRQUZBO0NBTUEsR0FBQSxXQUFBO0NBUEYsTUFBMkY7TUFQekY7Q0FyQk4sRUFxQk07O0NBckJOLEVBc0NNLENBQU4sS0FBTTtDQUNKLEVBQUksQ0FBSjtDQUNDLEVBQVUsQ0FBVixHQUFELElBQUE7Q0F4Q0YsRUFzQ007O0NBdENOLEVBMENRLEdBQVIsR0FBUTtDQUNOLEdBQUEsRUFBTSxLQUFOLEVBQUE7Q0FBQSxHQUNBLFNBQUE7Q0FGTSxVQUdOLHlCQUFBO0NBN0NGLEVBMENROztDQTFDUixFQStDaUIsTUFBQSxNQUFqQjtDQUNHLENBQVMsQ0FBTixDQUFILEVBQVMsR0FBUyxFQUFuQixFQUFpQztDQWhEbkMsRUErQ2lCOztDQS9DakIsQ0FrRG1CLENBQU4sTUFBQyxFQUFkLEtBQWE7QUFDSixDQUFQLEdBQUEsWUFBQTtDQUNFLEVBQUcsQ0FBQSxDQUFPLENBQVYsS0FBQTtDQUNHLEdBQUEsS0FBRCxNQUFBLFVBQUE7TUFERixFQUFBO0NBR0csRUFBRCxDQUFDLEtBQUQsTUFBQTtRQUpKO01BRFc7Q0FsRGIsRUFrRGE7O0NBbERiLEVBeURXLE1BQVg7Q0FDRSxHQUFBLEVBQUEsS0FBQTtDQUFBLEdBQ0EsRUFBQSxHQUFBO0NBQ0MsRUFDdUMsQ0FEdkMsQ0FBRCxDQUFBLEtBQUEsUUFBQSwrQkFBNEM7Q0E1RDlDLEVBeURXOztDQXpEWCxFQWdFWSxNQUFBLENBQVo7QUFDUyxDQUFQLEdBQUEsRUFBQTtDQUNFLEdBQUMsQ0FBRCxDQUFBLFVBQUE7TUFERjtDQUVDLEdBQUEsT0FBRCxRQUFBO0NBbkVGLEVBZ0VZOztDQWhFWixFQXFFbUIsTUFBQSxRQUFuQjtDQUNFLE9BQUEsR0FBQTtPQUFBLEtBQUE7Q0FBQSxHQUFBLEVBQUE7Q0FDRSxFQUFRLENBQUssQ0FBYixDQUFBLENBQWEsQ0FBOEI7Q0FBM0MsRUFDTyxDQUFQLEVBQUEsQ0FBWTtDQURaLEVBRVEsRUFBUixDQUFBLEdBQVE7Q0FDTCxHQUFELENBQUMsUUFBYSxFQUFkO0NBREYsQ0FFRSxDQUFRLENBQVAsR0FGSztDQUdQLEVBQU8sRUFBUixJQUFRLElBQVI7Q0FDRSxDQUF1RCxDQUF2RCxFQUFDLEdBQUQsUUFBQSxZQUFBO0NBQUEsQ0FDZ0QsQ0FBaEQsQ0FBa0QsQ0FBakQsR0FBRCxRQUFBLEtBQUE7Q0FDQyxJQUFBLENBQUQsU0FBQSxDQUFBO0NBSEYsQ0FJRSxDQUpGLElBQVE7TUFQTztDQXJFbkIsRUFxRW1COztDQXJFbkIsRUFrRmtCLE1BQUEsT0FBbEI7Q0FDRSxPQUFBLHNEQUFBO09BQUEsS0FBQTtDQUFBLEVBQVMsQ0FBVCxFQUFBO0NBQ0E7Q0FBQSxRQUFBLG1DQUFBO3VCQUFBO0NBQ0UsRUFBTSxDQUFILENBQUEsQ0FBSDtBQUNNLENBQUosRUFBaUIsQ0FBZCxDQUFXLENBQVgsRUFBSDtDQUNFLEVBQVMsRUFBQSxDQUFULElBQUE7VUFGSjtRQURGO0NBQUEsSUFEQTtDQUtBLEdBQUEsRUFBQTtDQUNFLEVBQVUsQ0FBVCxFQUFEO0NBQUEsR0FDQyxDQUFELENBQUEsVUFBQTtDQURBLEVBRWdCLENBQWYsRUFBRCxFQUFBO0NBRkEsR0FHQyxFQUFELFdBQUE7TUFURjtDQUFBLENBV21DLENBQW5DLENBQUEsR0FBQSxFQUFBLE1BQUE7Q0FYQSxFQVkwQixDQUExQixDQUFBLElBQTJCLE1BQTNCO0NBQ0UsS0FBQSxRQUFBO0NBQUEsR0FDQSxDQUFDLENBQUQsU0FBQTtDQUNDLEdBQUQsQ0FBQyxLQUFELEdBQUE7Q0FIRixJQUEwQjtDQUkxQjtDQUFBO1VBQUEsb0NBQUE7dUJBQUE7Q0FDRSxFQUFXLENBQVgsRUFBQSxDQUFXO0NBQVgsR0FDSSxFQUFKO0NBREEsQ0FFQSxFQUFDLEVBQUQsSUFBQTtDQUhGO3FCQWpCZ0I7Q0FsRmxCLEVBa0ZrQjs7Q0FsRmxCLENBd0dXLENBQUEsTUFBWDtDQUNFLE9BQUEsT0FBQTtDQUFBLEVBQVUsQ0FBVixHQUFBLEdBQVU7Q0FBVixDQUN5QixDQUFoQixDQUFULEVBQUEsQ0FBUyxFQUFpQjtDQUFPLElBQWMsSUFBZixJQUFBO0NBQXZCLElBQWdCO0NBQ3pCLEdBQUEsVUFBQTtDQUNFLENBQVUsQ0FBNkIsQ0FBN0IsQ0FBQSxPQUFBLFFBQU07TUFIbEI7Q0FJTyxLQUFELEtBQU47Q0E3R0YsRUF3R1c7O0NBeEdYLENBK0d3QixDQUFSLEVBQUEsSUFBQyxLQUFqQjtDQUNFLE9BQUEsQ0FBQTtDQUFBLEVBQVMsQ0FBVCxDQUFTLENBQVQsR0FBUztDQUNUO0NBQ0UsQ0FBd0MsSUFBMUIsRUFBWSxFQUFjLEdBQWpDO01BRFQ7Q0FHRSxLQURJO0NBQ0osQ0FBTyxDQUFlLEVBQWYsT0FBQSxJQUFBO01BTEs7Q0EvR2hCLEVBK0dnQjs7Q0EvR2hCLEVBc0hZLE1BQUEsQ0FBWjtDQUNFLE1BQUEsQ0FBQTtDQUFBLEVBQVUsQ0FBVixFQUE2QixDQUE3QixFQUE4QixJQUFOO0NBQXdCLEVBQVAsR0FBTSxFQUFOLEtBQUE7Q0FBL0IsSUFBbUI7Q0FDN0IsRUFBTyxDQUFQLEdBQWM7Q0FDWixHQUFVLENBQUEsT0FBQSxHQUFBO01BRlo7Q0FHQyxDQUFpQixDQUFBLEdBQWxCLENBQUEsRUFBbUIsRUFBbkI7Q0FDRSxJQUFBLEtBQUE7Q0FBTyxFQUFQLENBQUEsQ0FBeUIsQ0FBbkIsTUFBTjtDQURGLElBQWtCO0NBMUhwQixFQXNIWTs7Q0F0SFosQ0E2SHdCLENBQWIsTUFBWCxDQUFXLEdBQUE7Q0FDVCxPQUFBLEVBQUE7O0dBRCtDLEdBQWQ7TUFDakM7Q0FBQSxDQUFPLEVBQVAsQ0FBQSxLQUFPLEVBQUEsR0FBYztDQUNuQixFQUFxQyxDQUEzQixDQUFBLEtBQUEsRUFBQSxTQUFPO01BRG5CO0NBQUEsRUFFQSxDQUFBLEtBQTJCLElBQVA7Q0FBYyxFQUFELEVBQXdCLFFBQXhCO0NBQTNCLElBQW9CO0FBQ25CLENBQVAsRUFBQSxDQUFBO0NBQ0UsRUFBQSxDQUFhLEVBQWIsQ0FBTyxNQUFtQjtDQUMxQixFQUE2QyxDQUFuQyxDQUFBLEtBQU8sRUFBUCxpQkFBTztNQUxuQjtDQUFBLENBTTBDLENBQWxDLENBQVIsQ0FBQSxFQUFRLENBQU8sQ0FBNEI7Q0FDbkMsSUFBRCxJQUFMLElBQUE7Q0FETSxJQUFrQztBQUVuQyxDQUFQLEdBQUEsQ0FBQTtDQUNFLEVBQUEsR0FBQSxDQUFPO0NBQ1AsRUFBdUMsQ0FBN0IsQ0FBQSxDQUFPLEdBQUEsQ0FBUCxFQUFBLFdBQU87TUFWbkI7Q0FXYyxDQUFPLEVBQWpCLENBQUEsSUFBQSxFQUFBLEVBQUE7Q0F6SU4sRUE2SFc7O0NBN0hYLEVBMkltQixNQUFBLFFBQW5CO0NBQ0csRUFBd0IsQ0FBeEIsS0FBd0IsRUFBekIsSUFBQTtDQUNFLFNBQUEsa0VBQUE7Q0FBQSxFQUFTLENBQUEsRUFBVDtDQUFBLEVBQ1csQ0FBQSxFQUFYLEVBQUE7Q0FEQSxFQUVPLENBQVAsRUFBQSxJQUFPO0NBRlAsRUFHUSxDQUFJLENBQVosQ0FBQSxFQUFRO0NBQ1IsRUFBVyxDQUFSLENBQUEsQ0FBSDtDQUNFLEVBRU0sQ0FBQSxFQUZBLEVBQU4sRUFFTSwyQkFGVyxzSEFBakI7Q0FBQSxDQWFBLENBQUssQ0FBQSxFQUFNLEVBQVgsRUFBSztDQUNMO0NBQUEsWUFBQSwrQkFBQTt5QkFBQTtDQUNFLENBQUUsQ0FDSSxHQUROLElBQUEsQ0FBQSxTQUFhO0NBRGYsUUFkQTtDQUFBLENBa0JFLElBQUYsRUFBQSx5QkFBQTtDQWxCQSxFQXFCMEIsQ0FBMUIsQ0FBQSxDQUFNLEVBQU4sQ0FBMkI7Q0FDekIsYUFBQSxRQUFBO0NBQUEsU0FBQSxJQUFBO0NBQUEsQ0FDQSxDQUFLLENBQUEsTUFBTDtDQURBLENBRVMsQ0FBRixDQUFQLE1BQUE7Q0FDQSxHQUFHLENBQVEsQ0FBWCxJQUFBO0NBQ0UsQ0FBTSxDQUFGLENBQUEsRUFBQSxHQUFBLEdBQUo7Q0FDQSxHQUFPLENBQVksQ0FBbkIsTUFBQTtDQUNHLElBQUQsZ0JBQUE7Y0FISjtJQUlRLENBQVEsQ0FKaEIsTUFBQTtDQUtFLENBQU0sQ0FBRixDQUFBLEVBQUEsR0FBQSxHQUFKO0NBQ0EsR0FBTyxDQUFZLENBQW5CLE1BQUE7Q0FDRyxJQUFELGdCQUFBO2NBUEo7TUFBQSxNQUFBO0NBU0UsQ0FBRSxFQUFGLEVBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQTtDQUFBLENBQ0UsSUFBRixFQUFBLElBQUE7Q0FEQSxFQUVJLENBQUEsSUFBQSxJQUFKO0NBRkEsR0FHQSxFQUFNLElBQU4sRUFBQTtDQUhBLEVBSVMsR0FBVCxFQUFTLElBQVQ7Q0FDTyxDQUErQixDQUFFLENBQXhDLENBQUEsQ0FBTSxFQUFOLEVBQUEsU0FBQTtZQWxCc0I7Q0FBMUIsUUFBMEI7Q0FyQjFCLEdBd0NFLENBQUYsQ0FBUSxFQUFSO1FBN0NGO0NBK0NBLEVBQW1CLENBQWhCLEVBQUgsR0FBbUIsSUFBaEI7Q0FDRCxHQUFHLENBQVEsR0FBWDtDQUNFLEVBQVMsR0FBVCxJQUFBO0NBQUEsS0FDTSxJQUFOO0NBREEsS0FFTSxJQUFOLENBQUEsS0FBQTtDQUNPLEVBQVksRUFBSixDQUFULE9BQVMsSUFBZjtVQUxKO1FBaER1QjtDQUF6QixJQUF5QjtDQTVJM0IsRUEySW1COztDQTNJbkIsRUFtTXFCLE1BQUEsVUFBckI7Q0FDc0IsRUFBcEIsQ0FBcUIsT0FBckIsUUFBQTtDQXBNRixFQW1NcUI7O0NBbk1yQixFQXNNYSxNQUFDLEVBQWQsRUFBYTtDQUNWLENBQW1CLENBQUEsQ0FBVixDQUFVLENBQXBCLEVBQUEsQ0FBcUIsRUFBckI7Q0FBcUMsQ0FBTixHQUFLLFFBQUwsQ0FBQTtDQUEvQixJQUFvQjtDQXZNdEIsRUFzTWE7O0NBdE1iOztDQURzQixPQUFROztBQTJNaEMsQ0F4UUEsRUF3UWlCLEdBQVgsQ0FBTixFQXhRQTs7Ozs7O0FDQUEsQ0FBTyxFQUVMLEdBRkksQ0FBTjtDQUVFLENBQUEsQ0FBTyxFQUFQLENBQU8sR0FBQyxJQUFEO0NBQ0wsT0FBQSxFQUFBO0FBQU8sQ0FBUCxHQUFBLEVBQU8sRUFBQTtDQUNMLEVBQVMsR0FBVCxJQUFTO01BRFg7Q0FBQSxDQUVhLENBQUEsQ0FBYixNQUFBLEdBQWE7Q0FDUixFQUFlLENBQWhCLENBQUosQ0FBVyxJQUFYLENBQUE7Q0FKRixFQUFPO0NBRlQsQ0FBQTs7Ozs7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDUkEsSUFBQSw2REFBQTtHQUFBO2tTQUFBOztBQUFBLENBQUEsRUFBWSxJQUFBLEVBQVosRUFBWTs7QUFDWixDQURBLEVBQ1ksSUFBQSxFQUFaLGtCQUFZOztBQUNaLENBRkEsRUFFQSxJQUFNLE9BQUE7O0FBQ04sQ0FBQSxJQUFBLEtBQUE7b0JBQUE7Q0FDRSxDQUFBLENBQU8sRUFBUCxDQUFPO0NBRFQ7O0FBS00sQ0FSTjtDQVNFOzs7OztDQUFBOztDQUFBLEVBQU0sQ0FBTixXQUFBOztDQUFBLEVBQ1csTUFBWCxLQURBOztDQUFBLEVBRVUsS0FBVixDQUFtQixRQUZuQjs7Q0FBQSxFQUdjLFNBQWQsRUFBYzs7Q0FIZCxFQUlTLEdBSlQsQ0FJQTs7Q0FKQSxFQU1RLEdBQVIsR0FBUTtDQUNOLE9BQUEsc0lBQUE7Q0FBQSxFQUFXLENBQVgsSUFBQTtDQUFBLEVBQ2MsQ0FBZCxPQUFBLENBQWM7Q0FDZCxHQUFBLEVBQUEsS0FBYztDQUNaLENBRUUsQ0FGaUIsQ0FBQyxDQUFELENBQW5CLEdBQW1CLEdBQUEsRUFBQSxFQUFuQjtNQUhGO0NBQUEsRUFVVyxDQUFYLElBQUEsRUFBVyxDQUFBO0NBQ1gsR0FBQSxFQUFBLEVBQVc7Q0FDVCxDQUVFLENBRmUsQ0FBQyxDQUFELENBQWpCLEdBQWlCLENBQUEsSUFBakI7TUFaRjtDQUFBLEVBbUJhLENBQWIsTUFBQSxDQUFhLElBQUE7Q0FDYixHQUFBLEVBQUEsSUFBYTtDQUNYLENBRUUsQ0FGa0IsQ0FBQyxDQUFELENBQXBCLEdBQW9CLEtBQUEsQ0FBQSxFQUFwQjtNQXJCRjtDQUFBLEVBNEJnQixDQUFoQixPQUFnQixFQUFoQixHQUFnQjtDQUNoQixHQUFBLEVBQUEsT0FBZ0I7Q0FDZCxDQUVFLENBRnFCLENBQUMsQ0FBRCxDQUF2QixHQUF1QixLQUFBLEVBQUEsSUFBdkI7TUE5QkY7Q0FBQSxFQXFDRSxDQURGLEdBQUE7Q0FDRSxDQUFRLEVBQUMsQ0FBSyxDQUFkLEtBQVE7Q0FBUixDQUNhLEVBQUMsRUFBZCxLQUFBO0NBREEsQ0FFWSxFQUFDLENBQUssQ0FBbEIsSUFBQSxHQUFZO0NBRlosQ0FHTyxFQUFDLENBQVIsQ0FBQSxDQUFlO0NBSGYsQ0FJa0IsSUFBbEIsVUFBQTtDQUpBLENBS2dCLElBQWhCLEtBQTJCLEdBQTNCO0NBTEEsRUFPZ0IsR0FBaEIsS0FBMkIsR0FBM0I7Q0FQQSxFQVFZLEdBQVosSUFBQSxDQUF1QjtDQVJ2QixDQVVpQixJQUFqQixRQVZBLENBVUE7Q0FWQSxFQVdhLEdBQWIsRUFBcUIsR0FBckI7Q0FYQSxFQVlhLEdBQWIsRUFBcUIsR0FBckI7Q0FaQSxFQWFnQixHQUFoQixFQUF3QixNQUF4QjtDQWJBLENBZW1CLElBQW5CLFdBQUE7Q0FmQSxFQWdCZSxHQUFmLElBQXlCLEdBQXpCO0NBaEJBLEVBaUJlLEdBQWYsSUFBeUIsR0FBekI7Q0FqQkEsRUFrQmtCLEdBQWxCLElBQTRCLE1BQTVCO0NBbEJBLENBb0JzQixJQUF0QixjQUFBO0NBcEJBLEVBcUJrQixHQUFsQixPQUErQixHQUEvQjtDQXJCQSxFQXNCa0IsR0FBbEIsT0FBK0IsR0FBL0I7Q0F0QkEsRUF1QnFCLEdBQXJCLE9BQWtDLE1BQWxDO0NBNURGLEtBQUE7Q0FBQSxDQStEb0MsQ0FBaEMsQ0FBSixFQUFVLENBQUEsQ0FBUyxDQUFUO0NBQ1QsRUFBRCxDQUFDLE9BQUQsUUFBQTtDQXZFRixFQU1ROztDQU5SOztDQURpQzs7QUEyRW5DLENBbkZBLEVBbUZpQixHQUFYLENBQU4sYUFuRkE7Ozs7QUNBQSxJQUFBLHdEQUFBO0dBQUE7O2tTQUFBOztBQUFBLENBQUEsRUFBWSxJQUFBLEVBQVosRUFBWTs7QUFDWixDQURBLEVBQ1ksSUFBQSxFQUFaLGtCQUFZOztBQUNaLENBRkEsRUFFQSxJQUFNLE9BQUE7O0FBQ04sQ0FBQSxJQUFBLEtBQUE7b0JBQUE7Q0FDRSxDQUFBLENBQU8sRUFBUCxDQUFPO0NBRFQ7O0FBR00sQ0FOTjtDQU9FOzs7Ozs7Q0FBQTs7Q0FBQSxFQUFNLENBQU4sS0FBQTs7Q0FBQSxFQUNXLE1BQVg7O0NBREEsRUFFVSxLQUFWLENBQW1CLElBRm5COztDQUFBLENBS0UsQ0FGWSxTQUFkLElBQWM7O0NBSGQsRUFPUyxHQVBULENBT0E7O0NBUEEsRUFTUSxHQUFSLEdBQVE7Q0FFTixPQUFBLCtGQUFBO09BQUEsS0FBQTtDQUFBLENBQW9DLENBQTdCLENBQVAsR0FBTyxFQUFBLE9BQUE7Q0FBUCxFQUNjLENBQWQsT0FBQSxDQUFjO0NBQ2QsR0FBQSxFQUFBLEtBQWM7Q0FDWixDQUF5QyxDQUE3QixDQUFDLEVBQWIsQ0FBWSxFQUFaLENBQVksRUFBQSxJQUFBO0FBRVosQ0FBQSxVQUFBLHFDQUFBOzZCQUFBO0NBQ0UsQ0FBQSxDQUFpQixDQUFkLEdBQUEsQ0FBSCxFQUFHO0NBQ0QsRUFBRyxDQUFILEtBQUEsQ0FBQTtVQUZKO0NBQUEsTUFIRjtNQUZBO0NBQUEsRUFVVyxDQUFYLElBQUEsRUFBVyxDQUFBO0NBQ1gsR0FBQSxFQUFBLEVBQVc7Q0FDVCxDQUEyQyxDQUE3QixDQUFDLEVBQWYsQ0FBYyxFQUFBLENBQUEsQ0FBZCxLQUFjO01BWmhCO0NBQUEsRUFnQmEsQ0FBYixNQUFBLENBQWEsSUFBQTtDQUNiLEdBQUEsRUFBQSxJQUFhO0NBQ1gsQ0FBOEMsQ0FBN0IsQ0FBQyxFQUFsQixDQUFpQixFQUFBLENBQUEsSUFBakIsQ0FBaUIsQ0FBQTtNQWxCbkI7Q0FBQSxFQXNCRSxDQURGLEdBQUE7Q0FDRSxDQUFRLEVBQUMsQ0FBSyxDQUFkLEtBQVE7Q0FBUixDQUNhLEVBQUMsRUFBZCxLQUFBO0NBREEsQ0FFWSxFQUFDLENBQUssQ0FBbEIsSUFBQSxHQUFZO0NBRlosQ0FHTyxFQUFDLENBQVIsQ0FBQSxDQUFlO0NBSGYsQ0FJZ0IsSUFBaEIsS0FBMkIsR0FBM0I7Q0FKQSxDQUthLENBQXFCLEdBQWxDLEtBQUE7Q0FMQSxDQU1rQixJQUFsQixHQU5BLE9BTUE7Q0FOQSxDQU9pQixDQUFxQixHQUF0QyxLQUE0QixJQUE1QjtDQVBBLENBU1UsQ0FBa0IsR0FBNUIsRUFBQTtDQVRBLENBVWEsSUFBYixFQUFxQixHQUFyQjtDQVZBLENBV2EsSUFBYixLQUFBO0NBWEEsQ0FZZSxDQUFrQixHQUFqQyxFQUF1QixLQUF2QjtDQVpBLENBY2UsQ0FBb0IsR0FBbkMsSUFBeUIsR0FBekI7Q0FkQSxDQWVlLElBQWYsSUFBeUIsR0FBekI7Q0FmQSxDQWdCZ0IsSUFBaEIsUUFBQTtDQWhCQSxDQWlCa0IsQ0FBb0IsR0FBdEMsSUFBNEIsTUFBNUI7Q0FqQkEsQ0FrQmdCLENBQUEsQ0FBTyxFQUF2QixDQUFzQixFQUFBLEtBQXRCLEVBQXNCO0NBQ0EsY0FBRDtDQURMLE1BQ0Y7Q0F6Q2hCLEtBQUE7Q0FBQSxDQTJDb0MsQ0FBaEMsQ0FBSixFQUFVLENBQUEsQ0FBUyxDQUFUO0NBM0NWLEVBNENBLENBQUEsZUFBQTtDQTVDQSxHQTZDQSxFQUFBLEdBQUE7Q0FBcUIsQ0FBMkIsSUFBMUIsa0JBQUE7Q0FBRCxDQUFxQyxHQUFOLENBQUEsQ0FBL0I7Q0E3Q3JCLEtBNkNBO0NBN0NBLEVBOENxQixDQUFyQixFQUFBLEdBQUE7Q0FDRyxJQUFELFFBQUEsT0FBQTtDQURGLElBQXFCO0NBRXBCLEdBQUEsT0FBRCxTQUFBO0NBM0RGLEVBU1E7O0NBVFIsRUE2RHNCLE1BQUEsV0FBdEI7Q0FDRSxPQUFBLGdQQUFBO0NBQUEsQ0FBQSxFQUFBLEVBQVM7Q0FDUCxFQUFPLENBQVAsRUFBQSxHQUFPO0NBQ1A7Q0FFRSxFQUFVLElBQVYsQ0FBQTtDQUFVLENBQ0YsQ0FBSixPQUFBLGdCQURNO0NBQUEsQ0FFRixDQUFKLE9BQUEsZ0JBRk07Q0FBQSxDQUdGLENBQUosT0FBQSxnQkFITTtDQUFBLENBSUYsQ0FBSixPQUFBLGdCQUpNO0NBQUEsQ0FLRixDQUFKLE9BQUEsZ0JBTE07Q0FBQSxDQU1GLENBQUosT0FBQSxnQkFOTTtDQUFBLENBT0YsQ0FBSixPQUFBLGdCQVBNO0NBQUEsQ0FRRixDQUFKLE9BQUEsZ0JBUk07Q0FBVixTQUFBO0NBQUEsQ0FVZ0MsQ0FBakIsQ0FBSSxJQUFuQixDQUFlLEdBQWY7Q0FWQSxFQVdTLEdBQVQsQ0FBaUIsQ0FBakIsSUFBaUI7Q0FYakIsRUFhQSxHQUFZLEVBQVo7Q0FiQSxFQWNPLENBQVAsRUFBTyxFQUFQLFFBQU87Q0FkUCxFQWVPLENBQVAsQ0FmQSxHQWVBO0NBZkEsRUFnQlksQ0FBSSxJQUFoQixDQUFBO0NBaEJBLENBaUI0QyxFQUEzQyxFQUFELEVBQUEsTUFBQSxJQUFBO0NBakJBLENBa0JtQyxFQUFsQyxJQUFELENBQUEsS0FBQTtDQWxCQSxDQW1CbUMsRUFBbEMsSUFBRCxDQUFBLEtBQUE7Q0FuQkEsQ0FvQndDLEVBQXZDLElBQUQsQ0FBQSxLQUFBO0NBcEJBLEVBcUIyQyxDQUExQyxJQUFELElBQXdCLEVBQXhCLEdBQUEsQ0FBd0I7TUF2QjFCLEVBQUE7Q0F5QkUsS0FBQSxFQURJO0NBQ0osQ0FBcUIsQ0FBckIsSUFBTyxDQUFQO1FBMUJGO0NBQUEsQ0E0QnVDLENBQTdCLENBQUMsRUFBWCxDQUFBLEVBQVUsT0FBQTtDQTVCVixFQTZCaUIsR0FBakIsUUFBQTtDQUFpQixDQUFNLEVBQUwsSUFBQSxFQUFEO0NBQUEsQ0FBeUIsR0FBUCxHQUFBO0NBQWxCLENBQXNDLEdBQVAsR0FBQTtDQUEvQixDQUFtRCxHQUFQLENBQTVDLEVBQTRDO0NBQTVDLENBQWlFLEdBQVAsR0FBQSxHQUExRDtDQTdCakIsT0FBQTtDQUFBLENBOEJ1QixDQUFoQixDQUFQLEVBQUEsQ0FBTyxFQUFpQjtDQUFrQixHQUFQLENBQWUsQ0FBVCxTQUFOO0NBQTVCLE1BQWdCO0NBOUJ2QixDQStCNEIsQ0FBcEIsQ0FBSSxDQUFaLENBQUE7Q0EvQkEsQ0FnQ3dCLENBQWhCLEVBQVIsQ0FBQSxHQUF5QjtDQUFPLEVBQVUsR0FBWCxTQUFBO0NBQXZCLE1BQWdCO0NBaEN4QixDQWlDcUIsQ0FBYixFQUFSLENBQUEsR0FBc0I7Q0FDWCxFQUFULEtBQUEsT0FBQTtDQURNLE1BQWE7Q0FqQ3JCLENBbUNtQyxDQUF2QixDQUFTLEVBQXJCLEdBQUE7Q0FBZ0QsRUFBRCxFQUFpQixFQUFwQixRQUFBO0NBQWhDLE1BQXVCO0FBQ25DLENBQUEsVUFBQSw2Q0FBQTswQkFBQTtDQUNFLEVBQXlCLENBQXRCLENBQXNCLENBQStCLEVBQXhELENBQWlFLENBQTlEO0NBQ0QsRUFBUSxFQUFSLElBQWtCLENBQWxCO0NBQUEsRUFDUSxDQUFvQixDQUE1QixJQUFrQixDQUFsQjtDQURBLEVBRWdCLEVBQWUsS0FBL0IsR0FBQSxDQUErQjtDQUMvQixlQUpGO1VBREY7Q0FBQSxNQXBDQTtDQUFBLENBK0NtRCxDQUR5QyxDQUgzRixDQUE4QixDQUEvQixDQUlnQyxNQUpELEtBQS9CLGtCQUErQixLQUFBLG9GQUEvQiwrVkFBK0I7Q0EzQy9CLEdBbURDLEVBQUQsR0FBQSxhQUFBO0NBbkRBLENBcUQwQixDQUFqQixHQUFULEdBQVM7Q0FBNkIsR0FBQSxXQUFMO0NBQXhCLE1BQWlCO0NBckQxQixFQXNEQSxDQUFBLEVBQUE7Q0F0REEsS0F1REEsQ0FBQTtDQXZEQSxDQXdEVSxDQUFGLEVBQVIsQ0FBQSxDQUVTLEVBQUE7Q0ExRFQsQ0EyRDZCLENBQWpCLEdBQVosR0FBQTtDQUNFLE9BQUEsSUFBQTtDQUFBLEVBQUEsQ0FBc0IsSUFBdEIsRUFBTTtDQUFOLENBQ3NELENBQXRELENBQXVCLEdBQVUsQ0FBakMsQ0FBaUMsQ0FBMUI7ZUFDUDtDQUFBLENBQ1MsQ0FBRSxFQUFULEVBQWtCLENBQVQsRUFBVDtDQURGLENBRVEsQ0FGUixDQUVFLE1BQUE7Q0FGRixDQUdTLENBSFQsRUFHRSxLQUFBO0NBSEYsQ0FJTyxDQUFMLE9BQUE7Q0FKRixDQUtFLENBQVcsRUFBUCxLQUFKO0NBUnlCO0NBQWpCLE1BQWlCO0NBM0Q3QixDQXNFQSxFQUFDLEVBQUQ7Q0F0RUEsQ0F1RUEsQ0FBSyxDQUFDLEVBQU47Q0F2RUEsQ0F3RU0sQ0FBRixFQUFRLENBQVo7Q0F4RUEsRUE4RUUsR0FERjtDQUNFLENBQUssQ0FBTCxLQUFBO0NBQUEsQ0FDTyxHQUFQLEdBQUE7Q0FEQSxDQUVRLElBQVIsRUFBQTtDQUZBLENBR00sRUFBTixJQUFBO0NBakZGLE9BQUE7Q0FBQSxFQWtGUSxDQUFBLENBQVIsQ0FBQTtDQWxGQSxFQW1GUyxHQUFUO0NBbkZBLENBcUZNLENBQUYsRUFBUSxDQUFaO0NBckZBLENBd0ZNLENBQUYsRUFBUSxDQUFaO0NBeEZBLENBNEZVLENBQUYsQ0FBQSxDQUFSLENBQUEsRUFBUTtDQTVGUixDQStGVSxDQUFGLENBQUEsQ0FBUixDQUFBO0NBL0ZBLENBbUdRLENBQVIsQ0FBaUIsQ0FBWCxDQUFOLENBQU0sQ0FBQSxHQUFBLENBSWdCO0NBdkd0QixDQTBHaUIsQ0FEZCxDQUFILENBQUEsQ0FBQSxDQUFBLENBQUEsR0FBQSxFQUFBLENBRXNCO0NBM0d0QixDQW9IaUIsQ0FEZCxDQUFILENBQUEsQ0FBQSxDQUFBLENBQUEsR0FBQSxFQUFBLGFBQUE7Q0FuSEEsQ0FnSW1CLENBSGhCLENBQUgsQ0FBQSxDQUFBLENBQUEsRUFBQTtDQUl5QixjQUFBO0NBSnpCLENBS29CLENBQVEsQ0FMNUIsQ0FLb0IsRUFETCxFQUVDO0NBQU0sY0FBQTtDQU50QixDQU9vQixDQUFBLENBUHBCLEdBTWUsQ0FOZixDQU9xQjtDQUFlLEVBQUEsR0FBVCxTQUFBO0NBUDNCLENBUW1CLENBQUEsRUFSbkIsQ0FBQSxDQU9vQixFQUNBO0NBQ2QsQ0FBc0IsQ0FBbEIsQ0FBQSxJQUFKLENBQUk7Q0FDRixHQUFLLENBQUwsWUFBQTtDQURFLFFBQWtCO0NBRXJCLEVBQUQsQ0FBUztDQVhmLE1BUW1CO0NBckluQixDQTZJaUIsQ0FIZCxDQUFILENBQ1csQ0FEWCxDQUFBLENBQUEsQ0FBQTtDQUlxQixFQUFPLFlBQVI7Q0FKcEIsQ0FLYSxDQUxiLENBQUEsR0FJYSxFQUNDO0NBQU8sQ0FBRCxDQUFlLEVBQU4sVUFBVDtDQUxwQixFQUFBLENBQUEsR0FLYTtDQS9JYixDQXFKaUIsQ0FIZCxDQUFILENBQ1csQ0FEWCxDQUFBLEVBQUEsRUFBQSxDQUFBO0NBSXFCLEVBQU8sWUFBUjtDQUpwQixDQUthLENBTGIsQ0FBQSxHQUlhLEVBQ0M7Q0FBTyxDQUFELENBQWUsRUFBTixVQUFUO0NBTHBCLEVBTVEsQ0FOUixHQUthLEVBQ0o7Q0FBRCxjQUFPO0NBTmYsTUFNUTtDQXhKUixHQTBKQyxFQUFELHVCQUFBO0FBQ0EsQ0FBQSxVQUFBLHVDQUFBO2tDQUFBO0NBQ0UsQ0FBOEIsQ0FDWSxDQUR6QyxDQUE2QixDQUE5QixFQUFBLE9BQUEsSUFBOEIsb0NBQUE7Q0FEaEMsTUEzSkE7Q0ErSkMsR0FBQSxFQUFELE9BQUEsYUFBQTtNQWpLa0I7Q0E3RHRCLEVBNkRzQjs7Q0E3RHRCOztDQUQ0Qjs7QUFnTzlCLENBdE9BLEVBc09pQixHQUFYLENBQU4sUUF0T0E7Ozs7QUNBQSxJQUFBLHlIQUFBO0dBQUE7a1NBQUE7O0FBQUEsQ0FBQSxFQUFZLElBQUEsRUFBWixFQUFZOztBQUNaLENBREEsRUFDWSxJQUFBLEVBQVosa0JBQVk7O0FBQ1osQ0FGQSxFQUVBLElBQU0sT0FBQTs7QUFDTixDQUFBLElBQUEsS0FBQTtvQkFBQTtDQUNFLENBQUEsQ0FBTyxFQUFQLENBQU87Q0FEVDs7QUFHQSxDQU5BLEVBTVEsRUFBUixFQUFRLElBQUE7O0FBQ1IsQ0FQQSxFQU9hLEVBUGIsS0FPQTs7QUFDQSxDQVJBLEVBUW9CLENBUnBCLGFBUUE7O0FBQ0EsQ0FUQSxFQVNZLElBQUEsRUFBWixNQUFZOztBQUNaLENBVkEsQ0FBQSxDQVVXLEtBQVg7O0FBQ0EsQ0FBQSxJQUFBLFdBQUE7d0JBQUE7Q0FDRSxDQUFBLENBQVksSUFBSCxDQUFBLCtCQUFBO0NBRFg7O0FBR00sQ0FkTjtDQWVFOzs7OztDQUFBOztDQUFBLEVBQU0sQ0FBTixNQUFBOztDQUFBLEVBQ1csTUFBWCxDQURBOztDQUFBLEVBRVUsS0FBVixDQUFtQixJQUZuQjs7Q0FBQSxFQUdjLE9BQUEsRUFBZDs7Q0FIQSxFQUlTLEdBSlQsQ0FJQTs7Q0FKQSxFQU1RLEdBQVIsR0FBUTtDQUVOLE9BQUEsdWtCQUFBO0NBQUEsQ0FBQSxDQUFjLENBQWQsT0FBQTtDQUFBLENBQUEsQ0FDbUIsQ0FBbkIsWUFBQTtDQURBLENBQUEsQ0FFVyxDQUFYLElBQUE7Q0FGQSxDQUFBLENBR2EsQ0FBYixNQUFBO0NBSEEsQ0FBQSxDQUllLENBQWYsUUFBQTtDQUpBLEVBT2MsQ0FBZCxPQUFBLENBQWM7Q0FQZCxFQVFpQixDQUFqQixFQVJBLEtBUTRCLEdBQTVCO0NBQ0EsRUFBb0IsQ0FBcEIsVUFBRztDQUNELENBRUUsQ0FGbUIsQ0FBQyxDQUFELENBQXJCLEdBQXFCLENBQUEsRUFBQSxNQUFyQjtDQUFBLENBT0UsQ0FGb0IsQ0FBQyxDQUFELENBQXRCLEdBQXNCLENBQUEsRUFBQSxDQUFBLE1BQXRCO0NBTEEsQ0FZRSxDQUZzQixDQUFDLENBQUQsQ0FBeEIsR0FBd0IsQ0FBQSxFQUFBLEdBQUEsTUFBeEI7Q0FWQSxDQWlCRSxDQUZ1QixDQUFDLENBQUQsQ0FBekIsR0FBeUIsQ0FBQSxFQUFBLElBQUEsTUFBekI7TUFoQkY7Q0FzQkUsRUFBcUIsR0FBckIsWUFBQTtDQUFBLEVBQ3dCLEdBQXhCLGVBQUE7Q0FEQSxFQUVzQixHQUF0QixhQUFBO0NBRkEsRUFHeUIsR0FBekIsZ0JBQUE7TUFsQ0Y7Q0FBQSxFQW9DbUIsQ0FBbkIsT0FBbUIsR0FBQSxFQUFuQjtDQXBDQSxFQXFDc0IsQ0FBdEIsRUFyQ0EsVUFxQ3NDLEdBQXRDO0NBQ0EsRUFBeUIsQ0FBekIsZUFBRztDQUNELENBRUUsQ0FGcUIsQ0FBQyxDQUFELENBQXZCLEdBQXVCLENBQUEsRUFBQSxFQUFBLE1BQXZCO0NBQUEsQ0FPRSxDQUZzQixDQUFDLENBQUQsQ0FBeEIsR0FBd0IsQ0FBQSxHQUFBLENBQUEsT0FBeEI7Q0FMQSxDQVlFLENBRndCLENBQUMsQ0FBRCxDQUExQixHQUEwQixDQUFBLElBQUEsQ0FBQSxRQUExQjtDQVZBLENBaUJFLENBRnlCLENBQUMsQ0FBRCxDQUEzQixHQUEyQixDQUFBLElBQUEsRUFBQSxRQUEzQjtNQWhCRjtDQXNCRSxFQUF1QixHQUF2QixjQUFBO0NBQUEsRUFDMEIsR0FBMUIsaUJBQUE7Q0FEQSxFQUV3QixHQUF4QixlQUFBO0NBRkEsRUFHMkIsR0FBM0Isa0JBQUE7TUEvREY7Q0FBQSxFQWlFWSxDQUFaLElBQUEsRUFBWSxDQUFBO0NBakVaLEVBa0VjLENBQWQsRUFsRUEsRUFrRXNCLEdBQXRCO0NBQ0EsRUFBaUIsQ0FBakIsT0FBRztDQUNELENBRUUsQ0FGa0IsQ0FBQyxDQUFELENBQXBCLEdBQW9CLENBQUEsRUFBQSxLQUFwQjtDQUFBLENBT0UsQ0FGbUIsQ0FBQyxDQUFELENBQXJCLEdBQXFCLENBQUEsR0FBQSxLQUFyQjtDQUxBLENBWUUsQ0FGcUIsQ0FBQyxDQUFELENBQXZCLEdBQXVCLENBQUEsS0FBQSxLQUF2QjtDQVZBLENBaUJFLENBRnNCLENBQUMsQ0FBRCxDQUF4QixHQUF3QixDQUFBLE1BQUEsS0FBeEI7TUFoQkY7Q0FzQkUsRUFBb0IsR0FBcEIsV0FBQTtDQUFBLEVBQ3VCLEdBQXZCLGNBQUE7Q0FEQSxFQUVxQixHQUFyQixZQUFBO0NBRkEsRUFHd0IsR0FBeEIsZUFBQTtNQTVGRjtDQUFBLEVBOEZhLENBQWIsTUFBQSxDQUFhLElBQUE7Q0E5RmIsRUErRmdCLENBQWhCLEVBL0ZBLElBK0YwQixHQUExQjtDQUNBLEVBQW1CLENBQW5CLFNBQUc7Q0FDRCxDQUVFLENBRm9CLENBQUMsQ0FBRCxDQUF0QixHQUFzQixDQUFBLEVBQUEsR0FBQSxJQUF0QjtDQUFBLENBT0UsQ0FGcUIsQ0FBQyxDQUFELENBQXZCLEdBQXVCLENBQUEsR0FBQSxFQUFBLEtBQXZCO0NBTEEsQ0FZRSxDQUZ1QixDQUFDLENBQUQsQ0FBekIsR0FBeUIsQ0FBQSxLQUFBLE9BQXpCO0NBVkEsQ0FpQkUsQ0FGd0IsQ0FBQyxDQUFELENBQTFCLEdBQTBCLENBQUEsS0FBQSxDQUFBLE9BQTFCO01BaEJGO0NBc0JFLEVBQXNCLEdBQXRCLGFBQUE7Q0FBQSxFQUN5QixHQUF6QixnQkFBQTtDQURBLEVBRXVCLEdBQXZCLGNBQUE7Q0FGQSxFQUcwQixHQUExQixpQkFBQTtNQXpIRjtDQUFBLEVBNEhnQixDQUFoQixPQTVIQSxFQTRIQSxDQUFnQixLQUFBO0NBNUhoQixDQTZIb0csQ0FBckYsQ0FBZixDQUFlLE9BQWYsS0FBZSxDQUFNLENBQUEsQ0FBQTtDQTdIckIsQ0E4SGtILENBQWhHLENBQWxCLENBQWtCLFVBQWxCLEtBQWtCLENBQU0sQ0FBQSxDQUFBO0NBOUh4QixDQStIeUcsQ0FBekYsQ0FBaEIsQ0FBZ0IsUUFBaEIsS0FBZ0IsQ0FBTSxDQUFBLENBQUE7Q0EvSHRCLENBZ0l3SCxDQUFyRyxDQUFuQixDQUFtQixXQUFuQixLQUFtQixDQUFNLENBQUEsQ0FBQTtDQWhJekIsRUFpSWMsQ0FBZCxPQUFBLEVBQWM7Q0FqSWQsRUFvSUUsQ0FERixHQUFBO0NBQ0UsQ0FBUSxFQUFDLENBQUssQ0FBZCxLQUFRO0NBQVIsQ0FDYSxFQUFDLEVBQWQsS0FBQTtDQURBLENBRVksRUFBQyxDQUFLLENBQWxCLElBQUEsR0FBWTtDQUZaLENBR2UsQ0FBZ0MsQ0FBL0IsQ0FBSyxDQUFyQixPQUFBO0NBSEEsQ0FJTyxFQUFDLENBQVIsQ0FBQSxDQUFlO0NBSmYsQ0FNZ0IsSUFBaEIsS0FBMkIsR0FBM0I7Q0FOQSxDQU9nQixDQUFxQixHQUFyQyxLQUEyQixHQUEzQjtDQVBBLENBUW1CLENBQXFCLEdBQXhDLEtBQThCLE1BQTlCO0NBUkEsQ0FTdUIsR0FBQSxDQUF2QixlQUFBO0NBVEEsQ0FVb0IsR0FBQSxDQUFwQixZQUFBO0NBVkEsQ0FXcUIsR0FBQSxDQUFyQixhQUFBO0NBWEEsQ0FZd0IsR0FBQSxDQUF4QixnQkFBQTtDQVpBLENBY2UsSUFBZixJQUF5QixHQUF6QjtDQWRBLENBZWUsQ0FBb0IsR0FBbkMsSUFBeUIsR0FBekI7Q0FmQSxDQWdCa0IsQ0FBb0IsR0FBdEMsSUFBNEIsTUFBNUI7Q0FoQkEsQ0FpQndCLEdBQUEsQ0FBeEIsZ0JBQUE7Q0FqQkEsQ0FrQnFCLEdBQUEsQ0FBckIsYUFBQTtDQWxCQSxDQW1Cc0IsR0FBQSxDQUF0QixjQUFBO0NBbkJBLENBb0J5QixHQUFBLENBQXpCLGlCQUFBO0NBcEJBLENBc0JnQixJQUFoQixRQUFBLEVBQWdDO0NBdEJoQyxDQXVCZ0IsQ0FBMEIsR0FBMUMsUUFBQSxFQUFnQztDQXZCaEMsQ0F3Qm1CLENBQTBCLEdBQTdDLFVBQW1DLENBQW5DO0NBeEJBLENBeUJ5QixHQUFBLENBQXpCLGlCQUFBO0NBekJBLENBMEJzQixHQUFBLENBQXRCLGNBQUE7Q0ExQkEsQ0EyQnVCLEdBQUEsQ0FBdkIsZUFBQTtDQTNCQSxDQTRCMEIsR0FBQSxDQUExQixrQkFBQTtDQTVCQSxDQThCYSxJQUFiLEVBQXFCLEdBQXJCO0NBOUJBLENBK0JhLENBQWtCLEdBQS9CLEVBQXFCLEdBQXJCO0NBL0JBLENBZ0NnQixDQUFrQixHQUFsQyxFQUF3QixNQUF4QjtDQWhDQSxDQWlDc0IsR0FBQSxDQUF0QixjQUFBO0NBakNBLENBa0NtQixHQUFBLENBQW5CLFdBQUE7Q0FsQ0EsQ0FtQ29CLEdBQUEsQ0FBcEIsWUFBQTtDQW5DQSxDQW9DdUIsR0FBQSxDQUF2QixlQUFBO0NBcENBLENBdUNhLElBQWIsS0FBQTtDQXZDQSxDQXdDZ0IsQ0FBZ0IsR0FBaEMsT0FBZ0IsQ0FBaEI7Q0F4Q0EsQ0F5Q2EsSUFBYixLQUFBLEVBekNBO0NBQUEsQ0EwQ2MsSUFBZCxNQUFBO0NBMUNBLENBMkNpQixJQUFqQixTQUFBO0NBM0NBLENBNENrQixJQUFsQixVQUFBO0NBNUNBLENBNkNlLElBQWYsT0FBQTtDQWpMRixLQUFBO0NBbUxDLENBQW1DLENBQWhDLENBQUgsRUFBUyxDQUFBLENBQVMsR0FBbkI7Q0EzTEYsRUFNUTs7Q0FOUixFQXdNUSxHQUFSLEdBQVE7Q0FDTixJQUFBLEdBQUE7O0NBQU0sSUFBRixDQUFKO01BQUE7Q0FETSxVQUVOLGdDQUFBO0NBMU1GLEVBd01ROztDQXhNUjs7Q0FENkI7O0FBNk0vQixDQTNOQSxFQTJOaUIsR0FBWCxDQUFOLFNBM05BOzs7O0FDQUEsSUFBQSw4R0FBQTtHQUFBOztrU0FBQTs7QUFBQSxDQUFBLEVBQVksSUFBQSxFQUFaLEVBQVk7O0FBQ1osQ0FEQSxFQUNZLElBQUEsRUFBWixrQkFBWTs7QUFDWixDQUZBLEVBRVEsRUFBUixFQUFRLElBQUE7O0FBQ1IsQ0FIQSxFQUdhLEVBSGIsS0FHQTs7QUFDQSxDQUpBLEVBSW9CLENBSnBCLGFBSUE7O0FBQ0EsQ0FMQSxFQUtZLElBQUEsRUFBWixNQUFZOztBQUNaLENBTkEsQ0FBQSxDQU1XLEtBQVg7O0FBQ0EsQ0FBQSxJQUFBLFdBQUE7d0JBQUE7Q0FDRSxDQUFBLENBQVksSUFBSCxDQUFBLCtCQUFBO0NBRFg7O0FBR00sQ0FWTjtDQVdFLEtBQUEsMENBQUE7O0NBQUE7Ozs7OztDQUFBOztDQUFBLEVBQU0sQ0FBTixPQUFBOztDQUFBLEVBQ1csTUFBWCxFQURBOztDQUFBLEVBRVUsS0FBVixDQUFtQixLQUZuQjs7Q0FBQSxFQUdjLFNBQWQsS0FBYzs7Q0FIZCxFQUlTLEdBSlQsQ0FJQTs7Q0FKQSxFQU9RLEdBQVIsR0FBUTtDQUVOLE9BQUEsZ0ZBQUE7Q0FBQSxDQUE4QyxDQUE5QixDQUFoQixHQUFnQixFQUFBLElBQWhCLElBQWdCO0NBQWhCLEVBRUUsQ0FERixHQUFBO0NBQ0UsQ0FBUSxFQUFDLENBQUssQ0FBZCxLQUFRO0NBQVIsQ0FDYSxFQUFDLEVBQWQsS0FBQTtDQURBLENBRVksRUFBQyxDQUFLLENBQWxCLElBQUEsR0FBWTtDQUZaLENBR08sRUFBQyxDQUFSLENBQUEsQ0FBZTtDQUxqQixLQUFBO0NBQUEsQ0FNb0MsQ0FBaEMsQ0FBSixFQUFVLENBQUEsQ0FBUztDQUVuQixDQUFBLEVBQUEsRUFBUztDQUVQLEVBQUksR0FBSjtDQUFBLEVBQ0ksR0FBSjtDQURBLEVBRVMsR0FBVDtDQUFTLENBQU0sRUFBTCxJQUFBO0NBQUQsQ0FBYyxDQUFKLEtBQUE7Q0FBVixDQUF1QixHQUFOLEdBQUE7Q0FBakIsQ0FBbUMsSUFBUixFQUFBO0NBQTNCLENBQTZDLEdBQU4sR0FBQTtDQUZoRCxPQUFBO0NBQUEsRUFHUyxFQUFULENBQUE7Q0FIQSxFQUlTLEVBQUEsQ0FBVDtDQUpBLEVBS1MsQ0FBQSxDQUFULENBQUE7Q0FMQSxFQU1TLEVBQUEsQ0FBVDtDQU5BLEVBU1UsQ0FBQyxDQUFELENBQVYsQ0FBQSxJQUFVLElBQUEsR0FBQTtDQVRWLENBa0JBLENBQUssQ0FBVyxFQUFoQixXQUFlO0NBbEJmLENBbUJFLEVBQUYsQ0FBQSxDQUFBLENBQUEsTUFBQTtDQW5CQSxDQXNCWSxDQUFGLENBQUEsQ0FBQSxDQUFWLENBQUEsUUFBVTtDQXRCVixDQTRCQSxDQUNtQixHQURuQixDQUFPLEVBQ2EsRUFEcEIsQ0FBQTtDQUMwQixDQUFtQyxDQUF5QyxDQUFyRSxDQUFBLENBQTJFLENBQXBFLENBQWlGLENBQXhGLENBQW1ILEVBQW5ILEdBQUEsU0FBNEMsT0FBQSxDQUFBO0NBRDdFLE1BQ21CO0NBN0JuQixDQStCQSxDQUNtQixHQURuQixDQUFPLEVBQ2EsRUFEcEIsQ0FBQTtDQUMwQixDQUE0QixDQUFhLENBQWxDLENBQUEsQ0FBQSxDQUFPLEVBQW1ELE1BQTFEO0NBRGpDLE1BQ21CO0NBaENuQixDQWtDQSxDQUNrQixHQURsQixDQUFPLEVBQ1ksQ0FEbkIsRUFBQTtDQUN5QixDQUFtQyxHQUE1QixFQUFPLENBQVAsSUFBQSxHQUFBO0NBRGhDLE1BQ2tCO0NBbkNsQixDQXFDQSxDQUNtQixHQURuQixDQUFPLEVBQ2EsRUFEcEIsQ0FBQTtDQUMwQixDQUFtQyxDQUF5QyxDQUFyRSxDQUFBLENBQTJFLENBQXBFLENBQWlGLENBQXhGLENBQW1ILEVBQW5ILEdBQUEsU0FBNEMsT0FBQSxDQUFBO0NBRDdFLE1BQ21CO0NBdENuQixDQXdDQSxDQUNtQixHQURuQixDQUFPLEVBQ2EsRUFEcEIsQ0FBQTtDQUMwQixDQUE0QixDQUFhLENBQWxDLENBQUEsQ0FBQSxDQUFPLEVBQW1ELE1BQTFEO0NBRGpDLE1BQ21CO0NBRVgsQ0FBUixDQUNrQixJQURYLEVBQ1ksQ0FEbkIsRUFBQSxDQUFBO0NBQ3lCLENBQW1DLEdBQTVCLEVBQU8sQ0FBUCxJQUFBLEdBQUE7Q0FEaEMsTUFDa0I7TUF4RGQ7Q0FQUixFQU9ROztDQVBSLENBaUVBLENBQVksQ0FBQSxHQUFBLEVBQVo7Q0FDRSxPQUFBLE9BQUE7Q0FBQSxFQUFPLENBQVAsR0FBZSxjQUFSO0NBQVAsRUFDUSxDQUFSLENBQUE7Q0FEQSxDQUVBLENBQUssQ0FBTCxDQUZBO0NBR0EsQ0FBd0IsQ0FBSyxDQUE3QixDQUFrQztDQUFsQyxDQUFhLENBQUQsQ0FBTCxTQUFBO01BSFA7Q0FJQSxDQUFBLENBQVksQ0FBTCxPQUFBO0NBdEVULEVBaUVZOztDQWpFWixFQXlFYSxNQUFBLEVBQWI7Q0FDRSxPQUFBLCtMQUFBO0NBQUEsRUFBTyxDQUFQO0NBQUEsRUFDUSxDQUFSLENBQUE7Q0FEQSxFQUVTLENBQVQsRUFBQTtDQUZBLEVBR1MsQ0FBVCxFQUFBO0NBQVMsQ0FBTSxFQUFMLEVBQUE7Q0FBRCxDQUFjLENBQUosR0FBQTtDQUFWLENBQXVCLEdBQU4sQ0FBQTtDQUFqQixDQUFtQyxJQUFSO0NBQTNCLENBQTZDLEdBQU4sQ0FBQTtDQUhoRCxLQUFBO0NBQUEsRUFJVSxDQUFWLEdBQUE7Q0FBVSxDQUFRLElBQVA7Q0FBRCxDQUFtQixJQUFQO0NBQVosQ0FBOEIsSUFBUDtDQUF2QixDQUF3QyxJQUFQO0NBSjNDLEtBQUE7Q0FBQSxFQUtPLENBQVA7Q0FMQSxFQU1PLENBQVA7Q0FOQSxFQU9VLENBQVYsR0FBQTtDQVBBLEVBUVMsQ0FBVCxFQUFBO0NBUkEsRUFTVSxDQUFWLEdBQUE7Q0FUQSxFQVVTLENBQVQsRUFBQTtDQVZBLEVBWVksQ0FBWixLQUFBO0NBWkEsRUFhWSxDQUFaLEtBQUE7Q0FiQSxFQWNPLENBQVA7Q0FkQSxFQWVPLENBQVAsS0FmQTtDQUFBLENBZ0JXLENBQUYsQ0FBVCxDQUFpQixDQUFqQjtDQWhCQSxDQWlCVyxDQUFGLENBQVQsQ0FBaUIsQ0FBakI7Q0FqQkEsRUFrQmUsQ0FBZixRQUFBO0NBbEJBLEVBbUJlLENBQWYsUUFBQTtDQW5CQSxFQW9CZSxDQUFmLFFBQUE7Q0FwQkEsRUFxQmUsQ0FBZixRQUFBO0NBQ0EsQ0FBQSxFQUFBLEVBQVM7Q0FFUCxDQUFBLEVBQUksRUFBSixXQUFBO0NBQUEsQ0FDQSxDQUFLLENBQUksRUFBVCxXQUFLO01BekJQO0NBQUEsRUE0QlEsQ0FBUixDQUFBLElBQVM7Q0FDRyxFQUFLLENBQWYsS0FBUyxJQUFUO0NBQ0UsV0FBQSxnSEFBQTtDQUFBLEVBQUksQ0FBSSxJQUFSLENBQWM7Q0FBaUIsT0FBWCxFQUFBLE9BQUE7Q0FBaEIsUUFBUztDQUFiLEVBQ0ksQ0FBSSxJQUFSLENBQWM7Q0FBaUIsTUFBWCxHQUFBLE9BQUE7Q0FBaEIsUUFBUztDQURiLEVBSWMsS0FBZCxHQUFBO0NBSkEsRUFLYSxFQUxiLEdBS0EsRUFBQTtDQUxBLEVBT2MsR0FQZCxFQU9BLEdBQUE7QUFFa0QsQ0FBbEQsR0FBaUQsSUFBakQsSUFBa0Q7Q0FBbEQsQ0FBVSxDQUFILENBQVAsTUFBQTtVQVRBO0FBV2tELENBQWxELEdBQWlELElBQWpELElBQWtEO0NBQWxELENBQVUsQ0FBSCxDQUFQLE1BQUE7VUFYQTtDQUFBLENBY2EsQ0FBRixHQUFPLEVBQWxCO0NBZEEsQ0FlYSxDQUFGLENBQWMsRUFBZCxFQUFYLFNBQXFCO0NBZnJCLENBZ0JRLENBQVIsQ0FBb0IsQ0FBZCxDQUFBLEVBQU4sU0FBZ0I7Q0FoQmhCLEVBaUJHLEdBQUgsRUFBQTtDQWpCQSxDQW9Ca0IsQ0FBZixDQUFILENBQWtCLENBQVksQ0FBOUIsQ0FBQTtDQXBCQSxFQXVCSSxHQUFBLEVBQUo7Q0F2QkEsQ0EyQlksQ0FEWixDQUFBLEVBQUEsQ0FBQSxDQUFBLENBQUEsQ0FBQSxDQUNZO0NBM0JaLENBb0NnRCxDQUF2QyxDQUFDLENBQUQsQ0FBVCxFQUFBLEVBQWdELENBQXRDO0NBcENWLENBcUMrQyxDQUF0QyxFQUFBLENBQVQsRUFBQSxHQUFVO0NBckNWLEdBc0NBLENBQUEsQ0FBTSxFQUFOO0NBdENBLEdBdUNBLENBQUEsQ0FBTSxFQUFOO0NBdkNBLENBd0NBLENBQUssQ0FBQSxDQUFRLENBQVIsRUFBTDtDQXhDQSxDQXlDQSxDQUFLLENBQUEsQ0FBUSxDQUFSLEVBQUw7QUFJK0IsQ0FBL0IsR0FBOEIsSUFBOUIsTUFBK0I7Q0FBL0IsQ0FBVyxDQUFGLEVBQUEsQ0FBVCxDQUFTLEdBQVQ7VUE3Q0E7QUE4QytCLENBQS9CLEdBQThCLElBQTlCLE1BQStCO0NBQS9CLENBQVcsQ0FBRixFQUFBLENBQVQsQ0FBUyxHQUFUO1VBOUNBO0NBQUEsQ0FpRG9DLENBQTVCLENBQUEsQ0FBUixDQUFRLENBQUEsQ0FBUjtDQWpEQSxDQXNEaUIsQ0FBQSxDQUpqQixDQUFLLENBQUwsQ0FBQSxDQUFBLENBQUE7Q0FJK0IsS0FBUCxXQUFBO0NBSnhCLENBS2lCLENBQUEsQ0FMakIsS0FJaUI7Q0FDYyxLQUFQLFdBQUE7Q0FMeEIsQ0FNaUIsQ0FOakIsQ0FBQSxDQUFBLENBTXVCLENBTnZCLENBQUEsQ0FLaUIsS0FMakIsRUFBQTtDQWxEQSxDQWtFZ0IsQ0FKaEIsQ0FBQSxDQUFLLENBQUwsQ0FBQSxDQUFBLENBQUE7Q0FJOEIsS0FBUCxXQUFBO0NBSnZCLENBS2dCLENBTGhCLENBQUEsRUFLc0IsQ0FBbUIsRUFEekI7Q0FFYSxLQUFYLElBQUEsT0FBQTtDQU5sQixRQU1XO0NBcEVYLENBcUVtQyxDQUFuQyxDQUFBLENBQUssQ0FBTCxDQUFBLENBQUEsS0FBQTtDQXJFQSxDQTZFaUIsQ0FBQSxDQUpqQixDQUFLLENBQUwsQ0FBQSxDQUFBLENBQUE7Q0FJaUMsS0FBRCxXQUFOO0NBSjFCLENBS2lCLENBQUEsQ0FMakIsS0FJaUI7Q0FDZ0IsQ0FBMEIsQ0FBakMsR0FBTSxDQUFtQixVQUF6QjtDQUwxQixDQU1vQixDQUFBLENBTnBCLEdBQUEsRUFLaUI7Q0FDRyxFQUFhLENBQUgsYUFBQTtDQU45QixDQU9nQixDQVBoQixDQUFBLEVBQUEsR0FNb0I7Q0FHRixFQUFBLFdBQUE7Q0FBQSxDQUFBLENBQUEsT0FBQTtDQUFBLEVBQ0EsTUFBTSxDQUFOO0NBQ0EsRUFBQSxjQUFPO0NBWHpCLENBYXFCLENBQUEsQ0FickIsSUFBQSxDQVFtQjtDQU1ELEVBQUEsV0FBQTtDQUFBLENBQU0sQ0FBTixDQUFVLENBQUosS0FBTjtDQUFBLEVBQ0EsT0FBQSxJQUFNO0NBQ04sRUFBQSxjQUFPO0NBaEJ6QixDQWtCMkIsQ0FsQjNCLENBQUEsS0FhcUIsS0FickI7Q0F6RUEsQ0FpR29CLENBSnBCLENBQUEsQ0FBSyxDQUFMLENBQUEsQ0FBQSxDQUFBLElBQUE7Q0FPUSxDQUFBLENBQW1CLENBQVosRUFBTSxXQUFOO0NBUGYsQ0FRZ0IsQ0FSaEIsQ0FBQSxLQU1nQjtDQUdELENBQTBCLENBQWpDLEdBQU0sQ0FBbUIsVUFBekI7Q0FUUixFQVVXLENBVlgsS0FRZ0I7Q0FFRSxFQUFpQixDQUFqQixFQUFhLEVBQWEsRUFBMkIsT0FBOUM7Q0FWekIsUUFVVztDQXZHWCxDQXlHb0MsQ0FBNUIsQ0FBQSxDQUFSLENBQVEsQ0FBQSxDQUFSO0NBekdBLENBOEdpQixDQUFBLENBSmpCLENBQUssQ0FBTCxDQUFBLENBQUEsQ0FBQTtDQUkrQixLQUFQLFdBQUE7Q0FKeEIsQ0FLaUIsQ0FBQSxDQUxqQixLQUlpQjtDQUNjLEtBQVAsV0FBQTtDQUx4QixDQU1pQixDQUNZLENBUDdCLENBQUEsQ0FNdUIsQ0FOdkIsQ0FBQSxDQUtpQixLQUxqQixFQUFBO0NBMUdBLENBMEhnQixDQUpoQixDQUFBLENBQUssQ0FBTCxDQUFBLENBQUEsQ0FBQTtDQUk4QixLQUFQLFdBQUE7Q0FKdkIsQ0FLZ0IsQ0FMaEIsQ0FBQSxFQUtzQixDQUFhLEVBRG5CO0NBRWEsS0FBWCxJQUFBLE9BQUE7Q0FObEIsUUFNVztDQTVIWCxDQTZIbUMsQ0FBbkMsQ0FBQSxDQUFLLENBQUwsQ0FBQSxDQUFBLEdBQUEsRUFJeUI7Q0FqSXpCLENBb0lrQyxDQUF6QixDQUFBLEVBQVQsRUFBQTtDQXBJQSxFQXNJRSxDQUFBLENBQUEsQ0FBTSxDQUFOLENBREYsQ0FDRSxHQURGO0NBS29CLEVBQWlCLENBQWpCLEVBQWEsRUFBYSxFQUEyQixPQUE5QztDQUp6QixDQUtpQixDQUxqQixDQUFBLEtBSVk7Q0FFSixhQUFBLGtCQUFBO0NBQUEsRUFBTyxDQUFQLEVBQU8sSUFBUDtDQUFBLEVBQ2EsQ0FBQSxNQUFiLFdBQWtCO0NBRGxCLEVBRWlCLENBQUEsTUFBakIsSUFBQSxPQUF1QjtDQUN2QixDQUFBLENBQW9CLENBQWpCLE1BQUgsSUFBRztDQUNELENBQUEsQ0FBaUIsU0FBakIsRUFBQTtZQUpGO0NBS0EsRUFBc0MsQ0FBYixDQUF6QixLQUFBO0NBQUEsYUFBQSxLQUFPO1lBTFA7Q0FNQSxFQUFZLENBQUwsYUFBQTtDQVpmLENBY2lCLENBZGpCLENBQUEsS0FLaUI7Q0FVVCxHQUFBLFVBQUE7Q0FBQSxFQUFPLENBQVAsRUFBTyxJQUFQO0NBQ0EsQ0FBQSxDQUEwQixDQUFQLE1BQW5CO0NBQUEsQ0FBQSxDQUFZLENBQUwsZUFBQTtZQURQO0NBRUEsRUFBWSxDQUFMLGFBQUE7Q0FqQmYsUUFjaUI7Q0FwSm5CLENBMkprQyxDQUF6QixDQUFBLEVBQVQsRUFBQTtDQTNKQSxDQWlLb0IsQ0FKbEIsQ0FBQSxDQUFBLENBQU0sQ0FBTixDQURGLENBQ0UsR0FERjtDQUtvQyxLQUFQLFdBQUE7Q0FKM0IsQ0FLa0IsQ0FBQSxDQUxsQixLQUlrQjtDQUNnQixLQUFQLFdBQUE7Q0FMM0IsQ0FNcUIsQ0FBQSxDQU5yQixHQUFBLEVBS2tCO0NBQ0csRUFBYSxDQUFILGFBQUE7Q0FOL0IsQ0FPaUIsQ0FQakIsQ0FBQSxFQUFBLEdBTXFCO0NBR0wsRUFBQSxXQUFBO0NBQUEsRUFBQSxPQUFBO0NBQUEsRUFDQSxNQUFNLENBQU47Q0FDQSxFQUFBLGNBQU87Q0FYdkIsQ0Fhc0IsQ0FBQSxDQWJ0QixJQUFBLENBUW9CO0NBTUosRUFBQSxXQUFBO0NBQUEsQ0FBTSxDQUFOLENBQVUsQ0FBSixLQUFOO0NBQUEsRUFDQSxPQUFBLElBQU07Q0FDTixFQUFBLGNBQU87Q0FoQnZCLENBa0I0QixDQWxCNUIsQ0FBQSxLQWFzQixLQWJ0QjtDQW9CVyxFQUF5QixDQUFiLEVBQUEsSUFBWixJQUFhO0NBQWIsa0JBQU87WUFBUDtDQUNBLGdCQUFPO0NBckJsQixRQW1CdUI7Q0FLeEIsQ0FDaUIsQ0FEbEIsQ0FBQSxFQUFBLENBQUEsQ0FBQSxFQUFBLENBQUEsR0FBQSxDQUFBO0NBdExGLE1BQWU7Q0E3QmpCLElBNEJRO0NBNUJSLEVBaU9jLENBQWQsQ0FBSyxJQUFVO0FBQ0ksQ0FBakIsR0FBZ0IsRUFBaEIsR0FBMEI7Q0FBMUIsSUFBQSxVQUFPO1FBQVA7Q0FBQSxFQUNRLEVBQVIsQ0FBQTtDQUZZLFlBR1o7Q0FwT0YsSUFpT2M7Q0FqT2QsRUFzT2UsQ0FBZixDQUFLLENBQUwsR0FBZ0I7QUFDSSxDQUFsQixHQUFpQixFQUFqQixHQUEyQjtDQUEzQixLQUFBLFNBQU87UUFBUDtDQUFBLEVBQ1MsRUFEVCxDQUNBO0NBRmEsWUFHYjtDQXpPRixJQXNPZTtDQXRPZixFQTJPZSxDQUFmLENBQUssQ0FBTCxHQUFnQjtBQUNJLENBQWxCLEdBQWlCLEVBQWpCLEdBQTJCO0NBQTNCLEtBQUEsU0FBTztRQUFQO0NBQUEsRUFDUyxFQURULENBQ0E7Q0FGYSxZQUdiO0NBOU9GLElBMk9lO0NBM09mLEVBZ1BnQixDQUFoQixDQUFLLEVBQUwsRUFBaUI7QUFDSSxDQUFuQixHQUFrQixFQUFsQixHQUE0QjtDQUE1QixNQUFBLFFBQU87UUFBUDtDQUFBLEVBQ1UsRUFEVixDQUNBLENBQUE7Q0FGYyxZQUdkO0NBblBGLElBZ1BnQjtDQWhQaEIsRUFxUGEsQ0FBYixDQUFLLElBQVM7QUFDSSxDQUFoQixHQUFlLEVBQWYsR0FBeUI7Q0FBekIsR0FBQSxXQUFPO1FBQVA7Q0FBQSxFQUNPLENBQVAsQ0FEQSxDQUNBO0NBRlcsWUFHWDtDQXhQRixJQXFQYTtDQXJQYixFQTBQZ0IsQ0FBaEIsQ0FBSyxFQUFMLEVBQWlCO0FBQ0ksQ0FBbkIsR0FBa0IsRUFBbEIsR0FBNEI7Q0FBNUIsTUFBQSxRQUFPO1FBQVA7Q0FBQSxFQUNVLEVBRFYsQ0FDQSxDQUFBO0NBRmMsWUFHZDtDQTdQRixJQTBQZ0I7Q0ExUGhCLEVBK1BlLENBQWYsQ0FBSyxDQUFMLEdBQWdCO0FBQ0ksQ0FBbEIsR0FBaUIsRUFBakIsR0FBMkI7Q0FBM0IsS0FBQSxTQUFPO1FBQVA7Q0FBQSxFQUNTLEVBRFQsQ0FDQTtDQUZhLFlBR2I7Q0FsUUYsSUErUGU7Q0EvUGYsRUFvUWEsQ0FBYixDQUFLLElBQVM7QUFDSSxDQUFoQixHQUFlLEVBQWYsR0FBeUI7Q0FBekIsR0FBQSxXQUFPO1FBQVA7Q0FBQSxFQUNPLENBQVAsQ0FEQSxDQUNBO0NBRlcsWUFHWDtDQXZRRixJQW9RYTtDQXBRYixFQXlRZ0IsQ0FBaEIsQ0FBSyxFQUFMLEVBQWlCO0FBQ0ksQ0FBbkIsR0FBa0IsRUFBbEIsR0FBNEI7Q0FBNUIsTUFBQSxRQUFPO1FBQVA7Q0FBQSxFQUNVLEVBRFYsQ0FDQSxDQUFBO0NBRmMsWUFHZDtDQTVRRixJQXlRZ0I7Q0F6UWhCLEVBOFFlLENBQWYsQ0FBSyxDQUFMLEdBQWdCO0FBQ0ksQ0FBbEIsR0FBaUIsRUFBakIsR0FBMkI7Q0FBM0IsS0FBQSxTQUFPO1FBQVA7Q0FBQSxFQUNTLEVBRFQsQ0FDQTtDQUZhLFlBR2I7Q0FqUkYsSUE4UWU7Q0E5UWYsRUFtUmtCLENBQWxCLENBQUssSUFBTDtBQUN1QixDQUFyQixHQUFvQixFQUFwQixHQUE4QjtDQUE5QixRQUFBLE1BQU87UUFBUDtDQUFBLEVBQ1ksRUFEWixDQUNBLEdBQUE7Q0FGZ0IsWUFHaEI7Q0F0UkYsSUFtUmtCO0NBblJsQixFQXdSbUIsQ0FBbkIsQ0FBSyxJQUFlLENBQXBCO0NBQ0UsU0FBQTtBQUFzQixDQUF0QixHQUFxQixFQUFyQixHQUErQjtDQUEvQixTQUFBLEtBQU87UUFBUDtDQUFBLEVBQ2EsRUFEYixDQUNBLElBQUE7Q0FGaUIsWUFHakI7Q0EzUkYsSUF3Um1CO0NBeFJuQixFQTZSa0IsQ0FBbEIsQ0FBSyxJQUFMO0FBQ3VCLENBQXJCLEdBQW9CLEVBQXBCLEdBQThCO0NBQTlCLFFBQUEsTUFBTztRQUFQO0NBQUEsRUFDWSxFQURaLENBQ0EsR0FBQTtDQUZnQixZQUdoQjtDQWhTRixJQTZSa0I7Q0E3UmxCLEVBa1NvQixDQUFwQixDQUFLLElBQWdCLEVBQXJCO0NBQ0UsU0FBQSxDQUFBO0FBQXVCLENBQXZCLEdBQXNCLEVBQXRCLEdBQWdDO0NBQWhDLFVBQUEsSUFBTztRQUFQO0NBQUEsRUFDYyxFQURkLENBQ0EsS0FBQTtDQUZrQixZQUdsQjtDQXJTRixJQWtTb0I7Q0FsU3BCLEVBdVNhLENBQWIsQ0FBSyxJQUFTO0FBQ0ksQ0FBaEIsR0FBZSxFQUFmLEdBQXlCO0NBQXpCLEdBQUEsV0FBTztRQUFQO0NBQUEsRUFDTyxDQUFQLENBREEsQ0FDQTtDQUZXLFlBR1g7Q0ExU0YsSUF1U2E7Q0F2U2IsRUE0U2EsQ0FBYixDQUFLLElBQVM7QUFDSSxDQUFoQixHQUFlLEVBQWYsR0FBeUI7Q0FBekIsR0FBQSxXQUFPO1FBQVA7Q0FBQSxFQUNPLENBQVAsQ0FEQSxDQUNBO0NBRlcsWUFHWDtDQS9TRixJQTRTYTtDQTVTYixFQWlUYSxDQUFiLENBQUssSUFBUztDQUNaLEdBQUEsTUFBQTtBQUFnQixDQUFoQixHQUFlLEVBQWYsR0FBeUI7Q0FBekIsR0FBQSxXQUFPO1FBQVA7Q0FBQSxFQUNPLENBQVAsQ0FEQSxDQUNBO0NBRlcsWUFHWDtDQXBURixJQWlUYTtDQWpUYixFQXNUYSxDQUFiLENBQUssSUFBUztDQUNaLEdBQUEsTUFBQTtBQUFnQixDQUFoQixHQUFlLEVBQWYsR0FBeUI7Q0FBekIsR0FBQSxXQUFPO1FBQVA7Q0FBQSxFQUNPLENBQVAsQ0FEQSxDQUNBO0NBRlcsWUFHWDtDQXpURixJQXNUYTtDQXRUYixFQTJUZSxDQUFmLENBQUssQ0FBTCxHQUFlO0NBQ2IsS0FBQSxPQUFPO0NBNVRULElBMlRlO0NBM1RmLEVBOFRlLENBQWYsQ0FBSyxDQUFMLEdBQWU7Q0FDYixLQUFBLE9BQU87Q0EvVFQsSUE4VGU7Q0E5VGYsRUFpVXFCLENBQXJCLENBQUssSUFBZ0IsR0FBckI7Q0FDRSxXQUFBLENBQU87Q0FsVVQsSUFpVXFCO0NBalVyQixFQW9VcUIsQ0FBckIsQ0FBSyxJQUFnQixHQUFyQjtDQUNFLFdBQUEsQ0FBTztDQXJVVCxJQW9VcUI7Q0FwVXJCLEVBdVVxQixDQUFyQixDQUFLLElBQWdCLEdBQXJCO0NBQ0UsV0FBQSxDQUFPO0NBeFVULElBdVVxQjtDQXhVVixVQTRVWDtDQXJaRixFQXlFYTs7Q0F6RWIsQ0F1WkEsQ0FBWSxNQUFaO0NBQ0UsS0FBQSxFQUFBO0NBQUEsQ0FBd0IsQ0FBZixDQUFULENBQVMsQ0FBVCxDQUFTLENBQUEsRUFBQSxDQUFBLENBQUEsRUFBQSxDQUFBO0NBQ1QsS0FBYyxLQUFQO0NBelpULEVBdVpZOztDQXZaWixDQTJaQSxDQUFpQixNQUFDLEtBQWxCO0NBQ0UsTUFBQSxDQUFBO0NBQUEsQ0FBb0IsQ0FBVixDQUFWLEVBQVUsQ0FBVjtDQUNBLE1BQWUsSUFBUjtDQTdaVCxFQTJaaUI7O0NBM1pqQixDQWdhQSxDQUFhLE1BQUMsQ0FBZDtDQUNFLEdBQUEsSUFBQTtDQUFBLEVBQUksQ0FBSjtDQUFBLENBQ21CLENBQVosQ0FBUCxDQUFPO0NBQ1AsRUFBbUIsQ0FBbkI7Q0FBQSxFQUFPLENBQVAsRUFBQTtNQUZBO0NBQUEsRUFHTyxDQUFQO0NBQ0csQ0FBRCxDQUFTLENBQUEsRUFBWCxLQUFBO0NBcmFGLEVBZ2FhOztDQWhhYjs7Q0FEOEI7O0FBd2FoQyxDQWxiQSxFQWtiaUIsR0FBWCxDQUFOLFVBbGJBOzs7O0FDQUEsQ0FBTyxFQUNMLEdBREksQ0FBTjtDQUNFLENBQUEsVUFBQSxjQUFBO0NBQUEsQ0FDQSxZQUFBLFlBREE7Q0FBQSxDQUVBLFFBQUEsZ0JBRkE7Q0FBQSxDQUdBLGFBQUEsV0FIQTtDQUFBLENBSUEsY0FBQSxVQUpBO0NBREYsQ0FBQTs7OztBQ0FBLElBQUEsaUZBQUE7O0FBQUEsQ0FBQSxFQUFZLElBQUEsRUFBWixrQkFBWTs7QUFDWixDQURBLEVBQ21CLElBQUEsU0FBbkIsV0FBbUI7O0FBQ25CLENBRkEsRUFFa0IsSUFBQSxRQUFsQixXQUFrQjs7QUFDbEIsQ0FIQSxFQUd1QixJQUFBLGFBQXZCLFdBQXVCOztBQUN2QixDQUpBLEVBSW9CLElBQUEsVUFBcEIsUUFBb0I7O0FBRXBCLENBTkEsRUFNVSxHQUFKLEdBQXFCLEtBQTNCO0NBQ0UsQ0FBQSxFQUFBLEVBQU0sU0FBTSxDQUFBLENBQUEsR0FBQTtDQUdMLEtBQUQsR0FBTixFQUFBLEtBQW1CO0NBSks7Ozs7QUNOMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLG51bGwsIm1vZHVsZS5leHBvcnRzID0gKGVsKSAtPlxuICAkZWwgPSAkIGVsXG4gIGFwcCA9IHdpbmRvdy5hcHBcbiAgdG9jID0gYXBwLmdldFRvYygpXG4gIHVubGVzcyB0b2NcbiAgICBjb25zb2xlLmxvZyAnTm8gdGFibGUgb2YgY29udGVudHMgZm91bmQnXG4gICAgcmV0dXJuXG4gIHRvZ2dsZXJzID0gJGVsLmZpbmQoJ2FbZGF0YS10b2dnbGUtbm9kZV0nKVxuICAjIFNldCBpbml0aWFsIHN0YXRlXG4gIGZvciB0b2dnbGVyIGluIHRvZ2dsZXJzLnRvQXJyYXkoKVxuICAgICR0b2dnbGVyID0gJCh0b2dnbGVyKVxuICAgIG5vZGVpZCA9ICR0b2dnbGVyLmRhdGEoJ3RvZ2dsZS1ub2RlJylcbiAgICB0cnlcbiAgICAgIHZpZXcgPSB0b2MuZ2V0Q2hpbGRWaWV3QnlJZCBub2RlaWRcbiAgICAgIG5vZGUgPSB2aWV3Lm1vZGVsXG4gICAgICAkdG9nZ2xlci5hdHRyICdkYXRhLXZpc2libGUnLCAhIW5vZGUuZ2V0KCd2aXNpYmxlJylcbiAgICAgICR0b2dnbGVyLmRhdGEgJ3RvY0l0ZW0nLCB2aWV3XG4gICAgY2F0Y2ggZVxuICAgICAgJHRvZ2dsZXIuYXR0ciAnZGF0YS1ub3QtZm91bmQnLCAndHJ1ZSdcblxuICB0b2dnbGVycy5vbiAnY2xpY2snLCAoZSkgLT5cbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAkZWwgPSAkKGUudGFyZ2V0KVxuICAgIHZpZXcgPSAkZWwuZGF0YSgndG9jSXRlbScpXG4gICAgaWYgdmlld1xuICAgICAgdmlldy50b2dnbGVWaXNpYmlsaXR5KGUpXG4gICAgICAkZWwuYXR0ciAnZGF0YS12aXNpYmxlJywgISF2aWV3Lm1vZGVsLmdldCgndmlzaWJsZScpXG4gICAgZWxzZVxuICAgICAgYWxlcnQgXCJMYXllciBub3QgZm91bmQgaW4gdGhlIGN1cnJlbnQgVGFibGUgb2YgQ29udGVudHMuIFxcbkV4cGVjdGVkIG5vZGVpZCAjeyRlbC5kYXRhKCd0b2dnbGUtbm9kZScpfVwiXG4iLCJjbGFzcyBKb2JJdGVtIGV4dGVuZHMgQmFja2JvbmUuVmlld1xuICBjbGFzc05hbWU6ICdyZXBvcnRSZXN1bHQnXG4gIGV2ZW50czoge31cbiAgYmluZGluZ3M6XG4gICAgXCJoNiBhXCI6XG4gICAgICBvYnNlcnZlOiBcInNlcnZpY2VOYW1lXCJcbiAgICAgIHVwZGF0ZVZpZXc6IHRydWVcbiAgICAgIGF0dHJpYnV0ZXM6IFt7XG4gICAgICAgIG5hbWU6ICdocmVmJ1xuICAgICAgICBvYnNlcnZlOiAnc2VydmljZVVybCdcbiAgICAgIH1dXG4gICAgXCIuc3RhcnRlZEF0XCI6XG4gICAgICBvYnNlcnZlOiBbXCJzdGFydGVkQXRcIiwgXCJzdGF0dXNcIl1cbiAgICAgIHZpc2libGU6ICgpIC0+XG4gICAgICAgIEBtb2RlbC5nZXQoJ3N0YXR1cycpIG5vdCBpbiBbJ2NvbXBsZXRlJywgJ2Vycm9yJ11cbiAgICAgIHVwZGF0ZVZpZXc6IHRydWVcbiAgICAgIG9uR2V0OiAoKSAtPlxuICAgICAgICBpZiBAbW9kZWwuZ2V0KCdzdGFydGVkQXQnKVxuICAgICAgICAgIHJldHVybiBcIlN0YXJ0ZWQgXCIgKyBtb21lbnQoQG1vZGVsLmdldCgnc3RhcnRlZEF0JykpLmZyb21Ob3coKSArIFwiLiBcIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgXCJcIlxuICAgIFwiLnN0YXR1c1wiOiAgICAgIFxuICAgICAgb2JzZXJ2ZTogXCJzdGF0dXNcIlxuICAgICAgb25HZXQ6IChzKSAtPlxuICAgICAgICBzd2l0Y2ggc1xuICAgICAgICAgIHdoZW4gJ3BlbmRpbmcnXG4gICAgICAgICAgICBcIndhaXRpbmcgaW4gbGluZVwiXG4gICAgICAgICAgd2hlbiAncnVubmluZydcbiAgICAgICAgICAgIFwicnVubmluZyBhbmFseXRpY2FsIHNlcnZpY2VcIlxuICAgICAgICAgIHdoZW4gJ2NvbXBsZXRlJ1xuICAgICAgICAgICAgXCJjb21wbGV0ZWRcIlxuICAgICAgICAgIHdoZW4gJ2Vycm9yJ1xuICAgICAgICAgICAgXCJhbiBlcnJvciBvY2N1cnJlZFwiXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgc1xuICAgIFwiLnF1ZXVlTGVuZ3RoXCI6IFxuICAgICAgb2JzZXJ2ZTogXCJxdWV1ZUxlbmd0aFwiXG4gICAgICBvbkdldDogKHYpIC0+XG4gICAgICAgIHMgPSBcIldhaXRpbmcgYmVoaW5kICN7dn0gam9iXCJcbiAgICAgICAgaWYgdi5sZW5ndGggPiAxXG4gICAgICAgICAgcyArPSAncydcbiAgICAgICAgcmV0dXJuIHMgKyBcIi4gXCJcbiAgICAgIHZpc2libGU6ICh2KSAtPlxuICAgICAgICB2PyBhbmQgcGFyc2VJbnQodikgPiAwXG4gICAgXCIuZXJyb3JzXCI6XG4gICAgICBvYnNlcnZlOiAnZXJyb3InXG4gICAgICB1cGRhdGVWaWV3OiB0cnVlXG4gICAgICB2aXNpYmxlOiAodikgLT5cbiAgICAgICAgdj8ubGVuZ3RoID4gMlxuICAgICAgb25HZXQ6ICh2KSAtPlxuICAgICAgICBpZiB2P1xuICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHYsIG51bGwsICcgICcpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBudWxsXG5cbiAgY29uc3RydWN0b3I6IChAbW9kZWwpIC0+XG4gICAgc3VwZXIoKVxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICBAJGVsLmh0bWwgXCJcIlwiXG4gICAgICA8aDY+PGEgaHJlZj1cIiNcIiB0YXJnZXQ9XCJfYmxhbmtcIj48L2E+PHNwYW4gY2xhc3M9XCJzdGF0dXNcIj48L3NwYW4+PC9oNj5cbiAgICAgIDxkaXY+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwic3RhcnRlZEF0XCI+PC9zcGFuPlxuICAgICAgICA8c3BhbiBjbGFzcz1cInF1ZXVlTGVuZ3RoXCI+PC9zcGFuPlxuICAgICAgICA8cHJlIGNsYXNzPVwiZXJyb3JzXCI+PC9wcmU+XG4gICAgICA8L2Rpdj5cbiAgICBcIlwiXCJcbiAgICBAc3RpY2tpdCgpXG5cbm1vZHVsZS5leHBvcnRzID0gSm9iSXRlbSIsImNsYXNzIFJlcG9ydFJlc3VsdHMgZXh0ZW5kcyBCYWNrYm9uZS5Db2xsZWN0aW9uXG5cbiAgZGVmYXVsdFBvbGxpbmdJbnRlcnZhbDogMzAwMFxuXG4gIGNvbnN0cnVjdG9yOiAoQHNrZXRjaCwgQGRlcHMpIC0+XG4gICAgQHVybCA9IHVybCA9IFwiL3JlcG9ydHMvI3tAc2tldGNoLmlkfS8je0BkZXBzLmpvaW4oJywnKX1cIlxuICAgIHN1cGVyKClcblxuICBwb2xsOiAoKSA9PlxuICAgIEBmZXRjaCB7XG4gICAgICBzdWNjZXNzOiAoKSA9PlxuICAgICAgICBAdHJpZ2dlciAnam9icydcbiAgICAgICAgZm9yIHJlc3VsdCBpbiBAbW9kZWxzXG4gICAgICAgICAgaWYgcmVzdWx0LmdldCgnc3RhdHVzJykgbm90IGluIFsnY29tcGxldGUnLCAnZXJyb3InXVxuICAgICAgICAgICAgdW5sZXNzIEBpbnRlcnZhbFxuICAgICAgICAgICAgICBAaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCBAcG9sbCwgQGRlZmF1bHRQb2xsaW5nSW50ZXJ2YWxcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAjIGFsbCBjb21wbGV0ZSB0aGVuXG4gICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKEBpbnRlcnZhbCkgaWYgQGludGVydmFsXG4gICAgICAgIGlmIHByb2JsZW0gPSBfLmZpbmQoQG1vZGVscywgKHIpIC0+IHIuZ2V0KCdlcnJvcicpPylcbiAgICAgICAgICBAdHJpZ2dlciAnZXJyb3InLCBcIlByb2JsZW0gd2l0aCAje3Byb2JsZW0uZ2V0KCdzZXJ2aWNlTmFtZScpfSBqb2JcIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgQHRyaWdnZXIgJ2ZpbmlzaGVkJ1xuICAgICAgZXJyb3I6IChlLCByZXMsIGEsIGIpID0+XG4gICAgICAgIHVubGVzcyByZXMuc3RhdHVzIGlzIDBcbiAgICAgICAgICBpZiByZXMucmVzcG9uc2VUZXh0Py5sZW5ndGhcbiAgICAgICAgICAgIHRyeVxuICAgICAgICAgICAgICBqc29uID0gSlNPTi5wYXJzZShyZXMucmVzcG9uc2VUZXh0KVxuICAgICAgICAgICAgY2F0Y2hcbiAgICAgICAgICAgICAgIyBkbyBub3RoaW5nXG4gICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoQGludGVydmFsKSBpZiBAaW50ZXJ2YWxcbiAgICAgICAgICBAdHJpZ2dlciAnZXJyb3InLCBqc29uPy5lcnJvcj8ubWVzc2FnZSBvciBcbiAgICAgICAgICAgICdQcm9ibGVtIGNvbnRhY3RpbmcgdGhlIFNlYVNrZXRjaCBzZXJ2ZXInXG4gICAgfVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlcG9ydFJlc3VsdHNcbiIsImVuYWJsZUxheWVyVG9nZ2xlcnMgPSByZXF1aXJlICcuL2VuYWJsZUxheWVyVG9nZ2xlcnMuY29mZmVlJ1xucm91bmQgPSByZXF1aXJlKCcuL3V0aWxzLmNvZmZlZScpLnJvdW5kXG5SZXBvcnRSZXN1bHRzID0gcmVxdWlyZSAnLi9yZXBvcnRSZXN1bHRzLmNvZmZlZSdcbnQgPSByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJylcbnRlbXBsYXRlcyA9XG4gIHJlcG9ydExvYWRpbmc6IHRbJ25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9yZXBvcnRMb2FkaW5nJ11cbkpvYkl0ZW0gPSByZXF1aXJlICcuL2pvYkl0ZW0uY29mZmVlJ1xuQ29sbGVjdGlvblZpZXcgPSByZXF1aXJlKCd2aWV3cy9jb2xsZWN0aW9uVmlldycpXG5cbmNsYXNzIFJlY29yZFNldFxuXG4gIGNvbnN0cnVjdG9yOiAoQGRhdGEsIEB0YWIsIEBza2V0Y2hDbGFzc0lkKSAtPlxuXG4gIHRvQXJyYXk6ICgpIC0+XG4gICAgaWYgQHNrZXRjaENsYXNzSWRcbiAgICAgIGRhdGEgPSBfLmZpbmQgQGRhdGEudmFsdWUsICh2KSA9PlxuICAgICAgICB2LmZlYXR1cmVzP1swXT8uYXR0cmlidXRlcz9bJ1NDX0lEJ10gaXMgQHNrZXRjaENsYXNzSWRcbiAgICAgIHVubGVzcyBkYXRhXG4gICAgICAgIHRocm93IFwiQ291bGQgbm90IGZpbmQgZGF0YSBmb3Igc2tldGNoQ2xhc3MgI3tAc2tldGNoQ2xhc3NJZH1cIlxuICAgIGVsc2VcbiAgICAgIGlmIF8uaXNBcnJheSBAZGF0YS52YWx1ZVxuICAgICAgICBkYXRhID0gQGRhdGEudmFsdWVbMF1cbiAgICAgIGVsc2VcbiAgICAgICAgZGF0YSA9IEBkYXRhLnZhbHVlXG4gICAgXy5tYXAgZGF0YS5mZWF0dXJlcywgKGZlYXR1cmUpIC0+XG4gICAgICBmZWF0dXJlLmF0dHJpYnV0ZXNcblxuICByYXc6IChhdHRyKSAtPlxuICAgIGF0dHJzID0gXy5tYXAgQHRvQXJyYXkoKSwgKHJvdykgLT5cbiAgICAgIHJvd1thdHRyXVxuICAgIGF0dHJzID0gXy5maWx0ZXIgYXR0cnMsIChhdHRyKSAtPiBhdHRyICE9IHVuZGVmaW5lZFxuICAgIGlmIGF0dHJzLmxlbmd0aCBpcyAwXG4gICAgICBjb25zb2xlLmxvZyBAZGF0YVxuICAgICAgQHRhYi5yZXBvcnRFcnJvciBcIkNvdWxkIG5vdCBnZXQgYXR0cmlidXRlICN7YXR0cn0gZnJvbSByZXN1bHRzXCJcbiAgICAgIHRocm93IFwiQ291bGQgbm90IGdldCBhdHRyaWJ1dGUgI3thdHRyfVwiXG4gICAgZWxzZSBpZiBhdHRycy5sZW5ndGggaXMgMVxuICAgICAgcmV0dXJuIGF0dHJzWzBdXG4gICAgZWxzZVxuICAgICAgcmV0dXJuIGF0dHJzXG5cbiAgaW50OiAoYXR0cikgLT5cbiAgICByYXcgPSBAcmF3KGF0dHIpXG4gICAgaWYgXy5pc0FycmF5KHJhdylcbiAgICAgIF8ubWFwIHJhdywgcGFyc2VJbnRcbiAgICBlbHNlXG4gICAgICBwYXJzZUludChyYXcpXG5cbiAgZmxvYXQ6IChhdHRyLCBkZWNpbWFsUGxhY2VzPTIpIC0+XG4gICAgcmF3ID0gQHJhdyhhdHRyKVxuICAgIGlmIF8uaXNBcnJheShyYXcpXG4gICAgICBfLm1hcCByYXcsICh2YWwpIC0+IHJvdW5kKHZhbCwgZGVjaW1hbFBsYWNlcylcbiAgICBlbHNlXG4gICAgICByb3VuZChyYXcsIGRlY2ltYWxQbGFjZXMpXG5cbiAgYm9vbDogKGF0dHIpIC0+XG4gICAgcmF3ID0gQHJhdyhhdHRyKVxuICAgIGlmIF8uaXNBcnJheShyYXcpXG4gICAgICBfLm1hcCByYXcsICh2YWwpIC0+IHZhbC50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkgaXMgJ3RydWUnXG4gICAgZWxzZVxuICAgICAgcmF3LnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKSBpcyAndHJ1ZSdcblxuY2xhc3MgUmVwb3J0VGFiIGV4dGVuZHMgQmFja2JvbmUuVmlld1xuICBuYW1lOiAnSW5mb3JtYXRpb24nXG4gIGRlcGVuZGVuY2llczogW11cblxuICBpbml0aWFsaXplOiAoQG1vZGVsLCBAb3B0aW9ucykgLT5cbiAgICAjIFdpbGwgYmUgaW5pdGlhbGl6ZWQgYnkgU2VhU2tldGNoIHdpdGggdGhlIGZvbGxvd2luZyBhcmd1bWVudHM6XG4gICAgIyAgICogbW9kZWwgLSBUaGUgc2tldGNoIGJlaW5nIHJlcG9ydGVkIG9uXG4gICAgIyAgICogb3B0aW9uc1xuICAgICMgICAgIC0gLnBhcmVudCAtIHRoZSBwYXJlbnQgcmVwb3J0IHZpZXdcbiAgICAjICAgICAgICBjYWxsIEBvcHRpb25zLnBhcmVudC5kZXN0cm95KCkgdG8gY2xvc2UgdGhlIHdob2xlIHJlcG9ydCB3aW5kb3dcbiAgICBAYXBwID0gd2luZG93LmFwcFxuICAgIF8uZXh0ZW5kIEAsIEBvcHRpb25zXG4gICAgQHJlcG9ydFJlc3VsdHMgPSBuZXcgUmVwb3J0UmVzdWx0cyhAbW9kZWwsIEBkZXBlbmRlbmNpZXMpXG4gICAgQGxpc3RlblRvT25jZSBAcmVwb3J0UmVzdWx0cywgJ2Vycm9yJywgQHJlcG9ydEVycm9yXG4gICAgQGxpc3RlblRvT25jZSBAcmVwb3J0UmVzdWx0cywgJ2pvYnMnLCBAcmVuZGVySm9iRGV0YWlsc1xuICAgIEBsaXN0ZW5Ub09uY2UgQHJlcG9ydFJlc3VsdHMsICdqb2JzJywgQHJlcG9ydEpvYnNcbiAgICBAbGlzdGVuVG8gQHJlcG9ydFJlc3VsdHMsICdmaW5pc2hlZCcsIF8uYmluZCBAcmVuZGVyLCBAXG4gICAgQGxpc3RlblRvT25jZSBAcmVwb3J0UmVzdWx0cywgJ3JlcXVlc3QnLCBAcmVwb3J0UmVxdWVzdGVkXG5cbiAgcmVuZGVyOiAoKSAtPlxuICAgIHRocm93ICdyZW5kZXIgbWV0aG9kIG11c3QgYmUgb3ZlcmlkZGVuJ1xuXG4gIHNob3c6ICgpIC0+XG4gICAgQCRlbC5zaG93KClcbiAgICBAdmlzaWJsZSA9IHRydWVcbiAgICBpZiBAZGVwZW5kZW5jaWVzPy5sZW5ndGggYW5kICFAcmVwb3J0UmVzdWx0cy5tb2RlbHMubGVuZ3RoXG4gICAgICBAcmVwb3J0UmVzdWx0cy5wb2xsKClcbiAgICBlbHNlIGlmICFAZGVwZW5kZW5jaWVzPy5sZW5ndGhcbiAgICAgIEByZW5kZXIoKVxuICAgICAgQCQoJ1tkYXRhLWF0dHJpYnV0ZS10eXBlPVVybEZpZWxkXSAudmFsdWUsIFtkYXRhLWF0dHJpYnV0ZS10eXBlPVVwbG9hZEZpZWxkXSAudmFsdWUnKS5lYWNoICgpIC0+XG4gICAgICAgIHRleHQgPSAkKEApLnRleHQoKVxuICAgICAgICBodG1sID0gW11cbiAgICAgICAgZm9yIHVybCBpbiB0ZXh0LnNwbGl0KCcsJylcbiAgICAgICAgICBpZiB1cmwubGVuZ3RoXG4gICAgICAgICAgICBuYW1lID0gXy5sYXN0KHVybC5zcGxpdCgnLycpKVxuICAgICAgICAgICAgaHRtbC5wdXNoIFwiXCJcIjxhIHRhcmdldD1cIl9ibGFua1wiIGhyZWY9XCIje3VybH1cIj4je25hbWV9PC9hPlwiXCJcIlxuICAgICAgICAkKEApLmh0bWwgaHRtbC5qb2luKCcsICcpXG5cblxuICBoaWRlOiAoKSAtPlxuICAgIEAkZWwuaGlkZSgpXG4gICAgQHZpc2libGUgPSBmYWxzZVxuXG4gIHJlbW92ZTogKCkgPT5cbiAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbCBAZXRhSW50ZXJ2YWxcbiAgICBAc3RvcExpc3RlbmluZygpXG4gICAgc3VwZXIoKVxuXG4gIHJlcG9ydFJlcXVlc3RlZDogKCkgPT5cbiAgICBAJGVsLmh0bWwgdGVtcGxhdGVzLnJlcG9ydExvYWRpbmcucmVuZGVyKHt9KVxuXG4gIHJlcG9ydEVycm9yOiAobXNnLCBjYW5jZWxsZWRSZXF1ZXN0KSA9PlxuICAgIHVubGVzcyBjYW5jZWxsZWRSZXF1ZXN0XG4gICAgICBpZiBtc2cgaXMgJ0pPQl9FUlJPUidcbiAgICAgICAgQHNob3dFcnJvciAnRXJyb3Igd2l0aCBzcGVjaWZpYyBqb2InXG4gICAgICBlbHNlXG4gICAgICAgIEBzaG93RXJyb3IgbXNnXG5cbiAgc2hvd0Vycm9yOiAobXNnKSA9PlxuICAgIEAkKCcucHJvZ3Jlc3MnKS5yZW1vdmUoKVxuICAgIEAkKCdwLmVycm9yJykucmVtb3ZlKClcbiAgICBAJCgnaDQnKS50ZXh0KFwiQW4gRXJyb3IgT2NjdXJyZWRcIikuYWZ0ZXIgXCJcIlwiXG4gICAgICA8cCBjbGFzcz1cImVycm9yXCIgc3R5bGU9XCJ0ZXh0LWFsaWduOmNlbnRlcjtcIj4je21zZ308L3A+XG4gICAgXCJcIlwiXG5cbiAgcmVwb3J0Sm9iczogKCkgPT5cbiAgICB1bmxlc3MgQG1heEV0YVxuICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykud2lkdGgoJzEwMCUnKVxuICAgIEAkKCdoNCcpLnRleHQgXCJBbmFseXppbmcgRGVzaWduc1wiXG5cbiAgc3RhcnRFdGFDb3VudGRvd246ICgpID0+XG4gICAgaWYgQG1heEV0YVxuICAgICAgdG90YWwgPSAobmV3IERhdGUoQG1heEV0YSkuZ2V0VGltZSgpIC0gbmV3IERhdGUoQGV0YVN0YXJ0KS5nZXRUaW1lKCkpIC8gMTAwMFxuICAgICAgbGVmdCA9IChuZXcgRGF0ZShAbWF4RXRhKS5nZXRUaW1lKCkgLSBuZXcgRGF0ZSgpLmdldFRpbWUoKSkgLyAxMDAwXG4gICAgICBfLmRlbGF5ICgpID0+XG4gICAgICAgIEByZXBvcnRSZXN1bHRzLnBvbGwoKVxuICAgICAgLCAobGVmdCArIDEpICogMTAwMFxuICAgICAgXy5kZWxheSAoKSA9PlxuICAgICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS5jc3MgJ3RyYW5zaXRpb24tdGltaW5nLWZ1bmN0aW9uJywgJ2xpbmVhcidcbiAgICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykuY3NzICd0cmFuc2l0aW9uLWR1cmF0aW9uJywgXCIje2xlZnQgKyAxfXNcIlxuICAgICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS53aWR0aCgnMTAwJScpXG4gICAgICAsIDUwMFxuXG4gIHJlbmRlckpvYkRldGFpbHM6ICgpID0+XG4gICAgbWF4RXRhID0gbnVsbFxuICAgIGZvciBqb2IgaW4gQHJlcG9ydFJlc3VsdHMubW9kZWxzXG4gICAgICBpZiBqb2IuZ2V0KCdldGEnKVxuICAgICAgICBpZiAhbWF4RXRhIG9yIGpvYi5nZXQoJ2V0YScpID4gbWF4RXRhXG4gICAgICAgICAgbWF4RXRhID0gam9iLmdldCgnZXRhJylcbiAgICBpZiBtYXhFdGFcbiAgICAgIEBtYXhFdGEgPSBtYXhFdGFcbiAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLndpZHRoKCc1JScpXG4gICAgICBAZXRhU3RhcnQgPSBuZXcgRGF0ZSgpXG4gICAgICBAc3RhcnRFdGFDb3VudGRvd24oKVxuXG4gICAgQCQoJ1tyZWw9ZGV0YWlsc10nKS5jc3MoJ2Rpc3BsYXknLCAnYmxvY2snKVxuICAgIEAkKCdbcmVsPWRldGFpbHNdJykuY2xpY2sgKGUpID0+XG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgIEAkKCdbcmVsPWRldGFpbHNdJykuaGlkZSgpXG4gICAgICBAJCgnLmRldGFpbHMnKS5zaG93KClcbiAgICBmb3Igam9iIGluIEByZXBvcnRSZXN1bHRzLm1vZGVsc1xuICAgICAgaXRlbSA9IG5ldyBKb2JJdGVtKGpvYilcbiAgICAgIGl0ZW0ucmVuZGVyKClcbiAgICAgIEAkKCcuZGV0YWlscycpLmFwcGVuZCBpdGVtLmVsXG5cbiAgZ2V0UmVzdWx0OiAoaWQpIC0+XG4gICAgcmVzdWx0cyA9IEBnZXRSZXN1bHRzKClcbiAgICByZXN1bHQgPSBfLmZpbmQgcmVzdWx0cywgKHIpIC0+IHIucGFyYW1OYW1lIGlzIGlkXG4gICAgdW5sZXNzIHJlc3VsdD9cbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gcmVzdWx0IHdpdGggaWQgJyArIGlkKVxuICAgIHJlc3VsdC52YWx1ZVxuXG4gIGdldEZpcnN0UmVzdWx0OiAocGFyYW0sIGlkKSAtPlxuICAgIHJlc3VsdCA9IEBnZXRSZXN1bHQocGFyYW0pXG4gICAgdHJ5XG4gICAgICByZXR1cm4gcmVzdWx0WzBdLmZlYXR1cmVzWzBdLmF0dHJpYnV0ZXNbaWRdXG4gICAgY2F0Y2ggZVxuICAgICAgdGhyb3cgXCJFcnJvciBmaW5kaW5nICN7cGFyYW19OiN7aWR9IGluIGdwIHJlc3VsdHNcIlxuXG4gIGdldFJlc3VsdHM6ICgpIC0+XG4gICAgcmVzdWx0cyA9IEByZXBvcnRSZXN1bHRzLm1hcCgocmVzdWx0KSAtPiByZXN1bHQuZ2V0KCdyZXN1bHQnKS5yZXN1bHRzKVxuICAgIHVubGVzcyByZXN1bHRzPy5sZW5ndGhcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gZ3AgcmVzdWx0cycpXG4gICAgXy5maWx0ZXIgcmVzdWx0cywgKHJlc3VsdCkgLT5cbiAgICAgIHJlc3VsdC5wYXJhbU5hbWUgbm90IGluIFsnUmVzdWx0Q29kZScsICdSZXN1bHRNc2cnXVxuXG4gIHJlY29yZFNldDogKGRlcGVuZGVuY3ksIHBhcmFtTmFtZSwgc2tldGNoQ2xhc3NJZD1mYWxzZSkgLT5cbiAgICB1bmxlc3MgZGVwZW5kZW5jeSBpbiBAZGVwZW5kZW5jaWVzXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJVbmtub3duIGRlcGVuZGVuY3kgI3tkZXBlbmRlbmN5fVwiXG4gICAgZGVwID0gQHJlcG9ydFJlc3VsdHMuZmluZCAocikgLT4gci5nZXQoJ3NlcnZpY2VOYW1lJykgaXMgZGVwZW5kZW5jeVxuICAgIHVubGVzcyBkZXBcbiAgICAgIGNvbnNvbGUubG9nIEByZXBvcnRSZXN1bHRzLm1vZGVsc1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwiQ291bGQgbm90IGZpbmQgcmVzdWx0cyBmb3IgI3tkZXBlbmRlbmN5fS5cIlxuICAgIHBhcmFtID0gXy5maW5kIGRlcC5nZXQoJ3Jlc3VsdCcpLnJlc3VsdHMsIChwYXJhbSkgLT5cbiAgICAgIHBhcmFtLnBhcmFtTmFtZSBpcyBwYXJhbU5hbWVcbiAgICB1bmxlc3MgcGFyYW1cbiAgICAgIGNvbnNvbGUubG9nIGRlcC5nZXQoJ2RhdGEnKS5yZXN1bHRzXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJDb3VsZCBub3QgZmluZCBwYXJhbSAje3BhcmFtTmFtZX0gaW4gI3tkZXBlbmRlbmN5fVwiXG4gICAgbmV3IFJlY29yZFNldChwYXJhbSwgQCwgc2tldGNoQ2xhc3NJZClcblxuICBlbmFibGVUYWJsZVBhZ2luZzogKCkgLT5cbiAgICBAJCgnW2RhdGEtcGFnaW5nXScpLmVhY2ggKCkgLT5cbiAgICAgICR0YWJsZSA9ICQoQClcbiAgICAgIHBhZ2VTaXplID0gJHRhYmxlLmRhdGEoJ3BhZ2luZycpXG4gICAgICByb3dzID0gJHRhYmxlLmZpbmQoJ3Rib2R5IHRyJykubGVuZ3RoXG4gICAgICBwYWdlcyA9IE1hdGguY2VpbChyb3dzIC8gcGFnZVNpemUpXG4gICAgICBpZiBwYWdlcyA+IDFcbiAgICAgICAgJHRhYmxlLmFwcGVuZCBcIlwiXCJcbiAgICAgICAgICA8dGZvb3Q+XG4gICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgIDx0ZCBjb2xzcGFuPVwiI3skdGFibGUuZmluZCgndGhlYWQgdGgnKS5sZW5ndGh9XCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBhZ2luYXRpb25cIj5cbiAgICAgICAgICAgICAgICAgIDx1bD5cbiAgICAgICAgICAgICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCI+UHJldjwvYT48L2xpPlxuICAgICAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgPC90Zm9vdD5cbiAgICAgICAgXCJcIlwiXG4gICAgICAgIHVsID0gJHRhYmxlLmZpbmQoJ3Rmb290IHVsJylcbiAgICAgICAgZm9yIGkgaW4gXy5yYW5nZSgxLCBwYWdlcyArIDEpXG4gICAgICAgICAgdWwuYXBwZW5kIFwiXCJcIlxuICAgICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCI+I3tpfTwvYT48L2xpPlxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICB1bC5hcHBlbmQgXCJcIlwiXG4gICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCI+TmV4dDwvYT48L2xpPlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgJHRhYmxlLmZpbmQoJ2xpIGEnKS5jbGljayAoZSkgLT5cbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICAkYSA9ICQodGhpcylcbiAgICAgICAgICB0ZXh0ID0gJGEudGV4dCgpXG4gICAgICAgICAgaWYgdGV4dCBpcyAnTmV4dCdcbiAgICAgICAgICAgIGEgPSAkYS5wYXJlbnQoKS5wYXJlbnQoKS5maW5kKCcuYWN0aXZlJykubmV4dCgpLmZpbmQoJ2EnKVxuICAgICAgICAgICAgdW5sZXNzIGEudGV4dCgpIGlzICdOZXh0J1xuICAgICAgICAgICAgICBhLmNsaWNrKClcbiAgICAgICAgICBlbHNlIGlmIHRleHQgaXMgJ1ByZXYnXG4gICAgICAgICAgICBhID0gJGEucGFyZW50KCkucGFyZW50KCkuZmluZCgnLmFjdGl2ZScpLnByZXYoKS5maW5kKCdhJylcbiAgICAgICAgICAgIHVubGVzcyBhLnRleHQoKSBpcyAnUHJldidcbiAgICAgICAgICAgICAgYS5jbGljaygpXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgJGEucGFyZW50KCkucGFyZW50KCkuZmluZCgnLmFjdGl2ZScpLnJlbW92ZUNsYXNzICdhY3RpdmUnXG4gICAgICAgICAgICAkYS5wYXJlbnQoKS5hZGRDbGFzcyAnYWN0aXZlJ1xuICAgICAgICAgICAgbiA9IHBhcnNlSW50KHRleHQpXG4gICAgICAgICAgICAkdGFibGUuZmluZCgndGJvZHkgdHInKS5oaWRlKClcbiAgICAgICAgICAgIG9mZnNldCA9IHBhZ2VTaXplICogKG4gLSAxKVxuICAgICAgICAgICAgJHRhYmxlLmZpbmQoXCJ0Ym9keSB0clwiKS5zbGljZShvZmZzZXQsIG4qcGFnZVNpemUpLnNob3coKVxuICAgICAgICAkKCR0YWJsZS5maW5kKCdsaSBhJylbMV0pLmNsaWNrKClcblxuICAgICAgaWYgbm9Sb3dzTWVzc2FnZSA9ICR0YWJsZS5kYXRhKCduby1yb3dzJylcbiAgICAgICAgaWYgcm93cyBpcyAwXG4gICAgICAgICAgcGFyZW50ID0gJHRhYmxlLnBhcmVudCgpXG4gICAgICAgICAgJHRhYmxlLnJlbW92ZSgpXG4gICAgICAgICAgcGFyZW50LnJlbW92ZUNsYXNzICd0YWJsZUNvbnRhaW5lcidcbiAgICAgICAgICBwYXJlbnQuYXBwZW5kIFwiPHA+I3tub1Jvd3NNZXNzYWdlfTwvcD5cIlxuXG4gIGVuYWJsZUxheWVyVG9nZ2xlcnM6ICgpIC0+XG4gICAgZW5hYmxlTGF5ZXJUb2dnbGVycyhAJGVsKVxuXG4gIGdldENoaWxkcmVuOiAoc2tldGNoQ2xhc3NJZCkgLT5cbiAgICBfLmZpbHRlciBAY2hpbGRyZW4sIChjaGlsZCkgLT4gY2hpbGQuZ2V0U2tldGNoQ2xhc3MoKS5pZCBpcyBza2V0Y2hDbGFzc0lkXG5cblxubW9kdWxlLmV4cG9ydHMgPSBSZXBvcnRUYWJcbiIsIm1vZHVsZS5leHBvcnRzID1cbiAgXG4gIHJvdW5kOiAobnVtYmVyLCBkZWNpbWFsUGxhY2VzKSAtPlxuICAgIHVubGVzcyBfLmlzTnVtYmVyIG51bWJlclxuICAgICAgbnVtYmVyID0gcGFyc2VGbG9hdChudW1iZXIpXG4gICAgbXVsdGlwbGllciA9IE1hdGgucG93IDEwLCBkZWNpbWFsUGxhY2VzXG4gICAgTWF0aC5yb3VuZChudW1iZXIgKiBtdWx0aXBsaWVyKSAvIG11bHRpcGxpZXIiLCJ0aGlzW1wiVGVtcGxhdGVzXCJdID0gdGhpc1tcIlRlbXBsYXRlc1wiXSB8fCB7fTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvYXR0cmlidXRlcy9hdHRyaWJ1dGVJdGVtXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjx0ciBkYXRhLWF0dHJpYnV0ZS1pZD1cXFwiXCIpO18uYihfLnYoXy5mKFwiaWRcIixjLHAsMCkpKTtfLmIoXCJcXFwiIGRhdGEtYXR0cmlidXRlLWV4cG9ydGlkPVxcXCJcIik7Xy5iKF8udihfLmYoXCJleHBvcnRpZFwiLGMscCwwKSkpO18uYihcIlxcXCIgZGF0YS1hdHRyaWJ1dGUtdHlwZT1cXFwiXCIpO18uYihfLnYoXy5mKFwidHlwZVwiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGQgY2xhc3M9XFxcIm5hbWVcXFwiPlwiKTtfLmIoXy52KF8uZihcIm5hbWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRkIGNsYXNzPVxcXCJ2YWx1ZVxcXCI+XCIpO18uYihfLnYoXy5mKFwiZm9ybWF0dGVkVmFsdWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvdHI+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvYXR0cmlidXRlcy9hdHRyaWJ1dGVzVGFibGVcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPHRhYmxlIGNsYXNzPVxcXCJhdHRyaWJ1dGVzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiYXR0cmlidXRlc1wiLGMscCwxKSxjLHAsMCw0NCw4MSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKF8ucnAoXCJhdHRyaWJ1dGVzL2F0dHJpYnV0ZUl0ZW1cIixjLHAsXCIgICAgXCIpKTt9KTtjLnBvcCgpO31fLmIoXCI8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wibm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL2dlbmVyaWNBdHRyaWJ1dGVzXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO2lmKF8ucyhfLmQoXCJza2V0Y2hDbGFzcy5kZWxldGVkXCIsYyxwLDEpLGMscCwwLDI0LDI3MCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwiYWxlcnQgYWxlcnQtd2FyblxcXCIgc3R5bGU9XFxcIm1hcmdpbi1ib3R0b206MTBweDtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgVGhpcyBza2V0Y2ggd2FzIGNyZWF0ZWQgdXNpbmcgdGhlIFxcXCJcIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiB0ZW1wbGF0ZSwgd2hpY2ggaXNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIG5vIGxvbmdlciBhdmFpbGFibGUuIFlvdSB3aWxsIG5vdCBiZSBhYmxlIHRvIGNvcHkgdGhpcyBza2V0Y2ggb3IgbWFrZSBuZXdcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIHNrZXRjaGVzIG9mIHRoaXMgdHlwZS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCIgQXR0cmlidXRlczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKF8ucnAoXCJhdHRyaWJ1dGVzL2F0dHJpYnV0ZXNUYWJsZVwiLGMscCxcIiAgICBcIikpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9yZXBvcnRMb2FkaW5nXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydExvYWRpbmdcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPCEtLSA8ZGl2IGNsYXNzPVxcXCJzcGlubmVyXFxcIj4zPC9kaXY+IC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlJlcXVlc3RpbmcgUmVwb3J0IGZyb20gU2VydmVyPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcInByb2dyZXNzIHByb2dyZXNzLXN0cmlwZWQgYWN0aXZlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwiYmFyXFxcIiBzdHlsZT1cXFwid2lkdGg6IDEwMCU7XFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGEgaHJlZj1cXFwiI1xcXCIgcmVsPVxcXCJkZXRhaWxzXFxcIj5kZXRhaWxzPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJkZXRhaWxzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxuaWYodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICBtb2R1bGUuZXhwb3J0cyA9IHRoaXNbXCJUZW1wbGF0ZXNcIl07XG59IiwiUmVwb3J0VGFiID0gcmVxdWlyZSAncmVwb3J0VGFiJ1xudGVtcGxhdGVzID0gcmVxdWlyZSAnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcbmlkcyA9IHJlcXVpcmUgJy4vaWRzLmNvZmZlZSdcbmZvciBrZXksIHZhbHVlIG9mIGlkc1xuICB3aW5kb3dba2V5XSA9IHZhbHVlXG5cblxuXG5jbGFzcyBBcnJheUZpc2hpbmdWYWx1ZVRhYiBleHRlbmRzIFJlcG9ydFRhYlxuICBuYW1lOiAnRmlzaGluZyBWYWx1ZSdcbiAgY2xhc3NOYW1lOiAnZmlzaGluZ1ZhbHVlJ1xuICB0ZW1wbGF0ZTogdGVtcGxhdGVzLmFycmF5RmlzaGluZ1ZhbHVlXG4gIGRlcGVuZGVuY2llczogWydGaXNoaW5nVmFsdWUnXVxuICB0aW1lb3V0OiAyNDAwMDBcblxuICByZW5kZXI6ICgpIC0+XG4gICAgbnVtVHlwZXMgPSAwXG4gICAgc2FuY3R1YXJpZXMgPSBAZ2V0Q2hpbGRyZW4gU0FOQ1RVQVJZX0lEXG4gICAgaWYgc2FuY3R1YXJpZXMubGVuZ3RoXG4gICAgICBzYW5jdHVhcnlQZXJjZW50ID0gQHJlY29yZFNldChcbiAgICAgICAgJ0Zpc2hpbmdWYWx1ZScsIFxuICAgICAgICAnRmlzaGluZ1ZhbHVlJywgXG4gICAgICAgIFNBTkNUVUFSWV9JRFxuICAgICAgKS5mbG9hdCgnUEVSQ0VOVCcsIDIpXG5cblxuICAgIG1vb3JpbmdzID0gQGdldENoaWxkcmVuIE1PT1JJTkdfSURcbiAgICBpZiBtb29yaW5ncy5sZW5ndGhcbiAgICAgIG1vb3JpbmdQZXJjZW50ID0gQHJlY29yZFNldChcbiAgICAgICAgJ0Zpc2hpbmdWYWx1ZScsIFxuICAgICAgICAnRmlzaGluZ1ZhbHVlJywgXG4gICAgICAgIE1PT1JJTkdfSURcbiAgICAgICkuZmxvYXQoJ1BFUkNFTlQnLCAyKVxuXG5cbiAgICBub05ldFpvbmVzID0gQGdldENoaWxkcmVuIE5PX05FVF9aT05FU19JRFxuICAgIGlmIG5vTmV0Wm9uZXMubGVuZ3RoXG4gICAgICBub05ldFpvbmVzUGVyY2VudCA9IEByZWNvcmRTZXQoXG4gICAgICAgICdGaXNoaW5nVmFsdWUnLCBcbiAgICAgICAgJ0Zpc2hpbmdWYWx1ZScsIFxuICAgICAgICBOT19ORVRfWk9ORVNfSURcbiAgICAgICkuZmxvYXQoJ1BFUkNFTlQnLCAwKVxuXG5cbiAgICBzaGlwcGluZ1pvbmVzID0gQGdldENoaWxkcmVuIFNISVBQSU5HX1pPTkVfSURcbiAgICBpZiBzaGlwcGluZ1pvbmVzLmxlbmd0aFxuICAgICAgc2hpcHBpbmdab25lc1BlcmNlbnQgPSBAcmVjb3JkU2V0KFxuICAgICAgICAnRmlzaGluZ1ZhbHVlJywgXG4gICAgICAgICdGaXNoaW5nVmFsdWUnLCBcbiAgICAgICAgU0hJUFBJTkdfWk9ORV9JRFxuICAgICAgKS5mbG9hdCgnUEVSQ0VOVCcsIDApXG5cbiAgICBjb250ZXh0ID1cbiAgICAgIHNrZXRjaDogQG1vZGVsLmZvclRlbXBsYXRlKClcbiAgICAgIHNrZXRjaENsYXNzOiBAc2tldGNoQ2xhc3MuZm9yVGVtcGxhdGUoKVxuICAgICAgYXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKVxuICAgICAgYWRtaW46IEBwcm9qZWN0LmlzQWRtaW4gd2luZG93LnVzZXJcbiAgICAgIHNhbmN0dWFyeVBlcmNlbnQ6IHNhbmN0dWFyeVBlcmNlbnRcbiAgICAgIG51bVNhbmN0dWFyaWVzOiBzYW5jdHVhcmllcy5sZW5ndGhcblxuICAgICAgaGFzU2FuY3R1YXJpZXM6IHNhbmN0dWFyaWVzPy5sZW5ndGggPiAwXG4gICAgICBzYW5jUGx1cmFsOiBzYW5jdHVhcmllcz8ubGVuZ3RoID4gMVxuXG4gICAgICBtb29yaW5nc1BlcmNlbnQ6IG1vb3JpbmdQZXJjZW50XG4gICAgICBudW1Nb29yaW5nczogbW9vcmluZ3M/Lmxlbmd0aFxuICAgICAgaGFzTW9vcmluZ3M6IG1vb3JpbmdzPy5sZW5ndGggPiAwXG4gICAgICBtb29yaW5nc1BsdXJhbDogbW9vcmluZ3M/Lmxlbmd0aCA+IDFcblxuICAgICAgbm9OZXRab25lc1BlcmNlbnQ6IG5vTmV0Wm9uZXNQZXJjZW50XG4gICAgICBudW1Ob05ldFpvbmVzOiBub05ldFpvbmVzPy5sZW5ndGhcbiAgICAgIGhhc05vTmV0Wm9uZXM6IG5vTmV0Wm9uZXM/Lmxlbmd0aCA+IDBcbiAgICAgIG5vTmV0Wm9uZXNQbHVyYWw6IG5vTmV0Wm9uZXM/Lmxlbmd0aCA+IDFcblxuICAgICAgc2hpcHBpbmdab25lc1BlcmNlbnQ6IHNoaXBwaW5nWm9uZXNQZXJjZW50XG4gICAgICBudW1TaGlwcGluZ1pvbmVzOiBzaGlwcGluZ1pvbmVzPy5sZW5ndGhcbiAgICAgIGhhc1NoaXBwaW5nWm9uZXM6IHNoaXBwaW5nWm9uZXM/Lmxlbmd0aCA+IDBcbiAgICAgIHNoaXBwaW5nWm9uZXNQbHVyYWw6IHNoaXBwaW5nWm9uZXM/Lmxlbmd0aCA+IDFcblxuXG4gICAgQCRlbC5odG1sIEB0ZW1wbGF0ZS5yZW5kZXIoY29udGV4dCwgdGVtcGxhdGVzKVxuICAgIEBlbmFibGVMYXllclRvZ2dsZXJzKEAkZWwpXG5cblxubW9kdWxlLmV4cG9ydHMgPSBBcnJheUZpc2hpbmdWYWx1ZVRhYiIsIlJlcG9ydFRhYiA9IHJlcXVpcmUgJ3JlcG9ydFRhYidcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5pZHMgPSByZXF1aXJlICcuL2lkcy5jb2ZmZWUnXG5mb3Iga2V5LCB2YWx1ZSBvZiBpZHNcbiAgd2luZG93W2tleV0gPSB2YWx1ZVxuXG5jbGFzcyBBcnJheUhhYml0YXRUYWIgZXh0ZW5kcyBSZXBvcnRUYWJcbiAgbmFtZTogJ0hhYml0YXQnXG4gIGNsYXNzTmFtZTogJ2hhYml0YXQnXG4gIHRlbXBsYXRlOiB0ZW1wbGF0ZXMuYXJyYXlIYWJpdGF0c1xuICBkZXBlbmRlbmNpZXM6IFtcbiAgICAnQmFyYnVkYUhhYml0YXQnXG4gICAgJ01hcnhhbkFuYWx5c2lzJ1xuICBdXG4gIHRpbWVvdXQ6IDI0MDAwMFxuICBcbiAgcmVuZGVyOiAoKSAtPlxuXG4gICAgZGF0YSA9IEByZWNvcmRTZXQoJ01hcnhhbkFuYWx5c2lzJywgJ01hcnhhbkFuYWx5c2lzJykudG9BcnJheSgpXG4gICAgc2FuY3R1YXJpZXMgPSBAZ2V0Q2hpbGRyZW4gU0FOQ1RVQVJZX0lEXG4gICAgaWYgc2FuY3R1YXJpZXMubGVuZ3RoXG4gICAgICBzYW5jdHVhcnkgPSBAcmVjb3JkU2V0KCdCYXJidWRhSGFiaXRhdCcsICdIYWJpdGF0cycsIFNBTkNUVUFSWV9JRClcbiAgICAgICAgLnRvQXJyYXkoKVxuICAgICAgZm9yIHJvdyBpbiBzYW5jdHVhcnlcbiAgICAgICAgaWYgcGFyc2VGbG9hdChyb3cuUGVyY2VudCkgPj0gMzNcbiAgICAgICAgICByb3cubWVldHNHb2FsID0gdHJ1ZVxuXG5cbiAgICBtb29yaW5ncyA9IEBnZXRDaGlsZHJlbiBNT09SSU5HX0lEXG4gICAgaWYgbW9vcmluZ3MubGVuZ3RoXG4gICAgICBtb29yaW5nRGF0YSA9IEByZWNvcmRTZXQoJ0JhcmJ1ZGFIYWJpdGF0JywgJ0hhYml0YXRzJywgTU9PUklOR19JRClcbiAgICAgICAgLnRvQXJyYXkoKVxuXG5cbiAgICBub05ldFpvbmVzID0gQGdldENoaWxkcmVuIE5PX05FVF9aT05FU19JRFxuICAgIGlmIG5vTmV0Wm9uZXMubGVuZ3RoXG4gICAgICBub05ldFpvbmVzRGF0YSA9IEByZWNvcmRTZXQoJ0JhcmJ1ZGFIYWJpdGF0JywgJ0hhYml0YXRzJywgXG4gICAgICAgIE5PX05FVF9aT05FU19JRCkudG9BcnJheSgpXG5cbiAgICBjb250ZXh0ID1cbiAgICAgIHNrZXRjaDogQG1vZGVsLmZvclRlbXBsYXRlKClcbiAgICAgIHNrZXRjaENsYXNzOiBAc2tldGNoQ2xhc3MuZm9yVGVtcGxhdGUoKVxuICAgICAgYXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKVxuICAgICAgYWRtaW46IEBwcm9qZWN0LmlzQWRtaW4gd2luZG93LnVzZXJcbiAgICAgIG51bVNhbmN0dWFyaWVzOiBzYW5jdHVhcmllcy5sZW5ndGhcbiAgICAgIHNhbmN0dWFyaWVzOiBzYW5jdHVhcmllcy5sZW5ndGggPiAwXG4gICAgICBzYW5jdHVhcnlIYWJpdGF0OiBzYW5jdHVhcnlcbiAgICAgIHNhbmN0dWFyeVBsdXJhbDogc2FuY3R1YXJpZXMubGVuZ3RoID4gMVxuICAgICAgXG4gICAgICBtb29yaW5nczogbW9vcmluZ3MubGVuZ3RoID4gMFxuICAgICAgbnVtTW9vcmluZ3M6IG1vb3JpbmdzLmxlbmd0aFxuICAgICAgbW9vcmluZ0RhdGE6IG1vb3JpbmdEYXRhXG4gICAgICBtb29yaW5nUGx1cmFsOiBtb29yaW5ncy5sZW5ndGggPiAxXG5cbiAgICAgIGhhc05vTmV0Wm9uZXM6IG5vTmV0Wm9uZXMubGVuZ3RoID4gMFxuICAgICAgbnVtTm9OZXRab25lczogbm9OZXRab25lcy5sZW5ndGhcbiAgICAgIG5vTmV0Wm9uZXNEYXRhOiBub05ldFpvbmVzRGF0YVxuICAgICAgbm9OZXRab25lc1BsdXJhbDogbm9OZXRab25lcy5sZW5ndGggPiAxXG4gICAgICBtYXJ4YW5BbmFseXNlczogXy5tYXAoQHJlY29yZFNldChcIk1hcnhhbkFuYWx5c2lzXCIsIFwiTWFyeGFuQW5hbHlzaXNcIilcbiAgICAgICAgLnRvQXJyYXkoKSwgKGYpIC0+IGYuTkFNRSlcbiAgICBcbiAgICBAJGVsLmh0bWwgQHRlbXBsYXRlLnJlbmRlcihjb250ZXh0LCB0ZW1wbGF0ZXMpXG4gICAgQGVuYWJsZUxheWVyVG9nZ2xlcnMoQCRlbClcbiAgICBAJCgnLmNob3NlbicpLmNob3Nlbih7ZGlzYWJsZV9zZWFyY2hfdGhyZXNob2xkOiAxMCwgd2lkdGg6JzQwMHB4J30pXG4gICAgQCQoJy5jaG9zZW4nKS5jaGFuZ2UgKCkgPT5cbiAgICAgIF8uZGVmZXIgQHJlbmRlck1hcnhhbkFuYWx5c2lzXG4gICAgQHJlbmRlck1hcnhhbkFuYWx5c2lzKClcblxuICByZW5kZXJNYXJ4YW5BbmFseXNpczogKCkgPT5cbiAgICBpZiB3aW5kb3cuZDNcbiAgICAgIG5hbWUgPSBAJCgnLmNob3NlbicpLnZhbCgpXG4gICAgICB0cnlcbiAgICAgICAgI2hvb2sgdXAgdGhlIGNoZWNrYm94ZXMgZm9yIG1hcnhhbiBzY2VuYXJpbyBuYW1lc1xuICAgICAgICBub2RlTWFwID0ge1xuICAgICAgICAgICAgXCIxXCI6XCI1MzNkZTIwYWE0OTg4NjdjNTZjNmNiYTVcIlxuICAgICAgICAgICAgXCIyXCI6XCI1MzNkZTIwYWE0OTg4NjdjNTZjNmNiYTdcIlxuICAgICAgICAgICAgXCIzXCI6XCI1MzNkZTIwYWE0OTg4NjdjNTZjNmNiYTlcIlxuICAgICAgICAgICAgXCI0XCI6XCI1MzNkZTIwYWE0OTg4NjdjNTZjNmNiYWJcIlxuICAgICAgICAgICAgXCI1XCI6XCI1MzNkZTIwYWE0OTg4NjdjNTZjNmNiYWRcIlxuICAgICAgICAgICAgXCI2XCI6XCI1MzNkZTIwYWE0OTg4NjdjNTZjNmNiYWZcIlxuICAgICAgICAgICAgXCI3XCI6XCI1MzNkZTIwYWE0OTg4NjdjNTZjNmNiYjFcIlxuICAgICAgICAgICAgXCI4XCI6XCI1MzNkZTIwYWE0OTg4NjdjNTZjNmNiYjNcIlxuICAgICAgICAgIH1cbiAgICAgICAgc2NlbmFyaW9OYW1lID0gbmFtZS5zdWJzdHJpbmcoMCwxKVxuICAgICAgICBub2RlSWQgPSBub2RlTWFwW3NjZW5hcmlvTmFtZV1cblxuICAgICAgICB0b2MgPSB3aW5kb3cuYXBwLmdldFRvYygpXG4gICAgICAgIHZpZXcgPSB0b2MuZ2V0Q2hpbGRWaWV3QnlJZChub2RlSWQpXG4gICAgICAgIG5vZGUgPSB2aWV3Lm1vZGVsXG4gICAgICAgIGlzVmlzaWJsZSA9IG5vZGUuZ2V0KCd2aXNpYmxlJylcbiAgICAgICAgQCQoJy5tYXJ4YW4tbm9kZScpLmF0dHIoJ2RhdGEtdG9nZ2xlLW5vZGUnLCBub2RlSWQpXG4gICAgICAgIEAkKCcubWFyeGFuLW5vZGUnKS5kYXRhKCd0b2NJdGVtJywgdmlldylcbiAgICAgICAgQCQoJy5tYXJ4YW4tbm9kZScpLmF0dHIoJ2NoZWNrZWQnLCBpc1Zpc2libGUpXG4gICAgICAgIEAkKCcubWFyeGFuLW5vZGUnKS5hdHRyKCdkYXRhLXZpc2libGUnLCBpc1Zpc2libGUpXG4gICAgICAgIEAkKCcubWFyeGFuLW5vZGUnKS50ZXh0KCdzaG93IFxcJ1NjZW5hcmlvICcrc2NlbmFyaW9OYW1lKydcXCcgbWFyeGFuIGxheWVyJylcbiAgICAgIGNhdGNoIGVcbiAgICAgICAgY29uc29sZS5sb2coXCJlcnJvclwiLCBlKVxuXG4gICAgICByZWNvcmRzID0gQHJlY29yZFNldChcIk1hcnhhbkFuYWx5c2lzXCIsIFwiTWFyeGFuQW5hbHlzaXNcIikudG9BcnJheSgpXG4gICAgICBxdWFudGlsZV9yYW5nZSA9IHtcIlEwXCI6XCJ2ZXJ5IGxvd1wiLCBcIlEyMFwiOiBcImxvd1wiLFwiUTQwXCI6IFwibWlkXCIsXCJRNjBcIjogXCJoaWdoXCIsXCJRODBcIjogXCJ2ZXJ5IGhpZ2hcIn1cbiAgICAgIGRhdGEgPSBfLmZpbmQgcmVjb3JkcywgKHJlY29yZCkgLT4gcmVjb3JkLk5BTUUgaXMgbmFtZVxuICAgICAgaGlzdG8gPSBkYXRhLkhJU1RPLnNsaWNlKDEsIGRhdGEuSElTVE8ubGVuZ3RoIC0gMSkuc3BsaXQoL1xccy8pXG4gICAgICBoaXN0byA9IF8uZmlsdGVyIGhpc3RvLCAocykgLT4gcy5sZW5ndGggPiAwXG4gICAgICBoaXN0byA9IF8ubWFwIGhpc3RvLCAodmFsKSAtPlxuICAgICAgICBwYXJzZUludCh2YWwpXG4gICAgICBxdWFudGlsZXMgPSBfLmZpbHRlcihfLmtleXMoZGF0YSksIChrZXkpIC0+IGtleS5pbmRleE9mKCdRJykgaXMgMClcbiAgICAgIGZvciBxLCBpIGluIHF1YW50aWxlc1xuICAgICAgICBpZiBwYXJzZUZsb2F0KGRhdGFbcV0pID4gcGFyc2VGbG9hdChkYXRhLlNDT1JFKSBvciBpIGlzIHF1YW50aWxlcy5sZW5ndGggLSAxXG4gICAgICAgICAgbWF4X3EgPSBxdWFudGlsZXNbaV1cbiAgICAgICAgICBtaW5fcSA9IHF1YW50aWxlc1tpIC0gMV0gb3IgXCJRMFwiICMgcXVhbnRpbGVzW2ldXG4gICAgICAgICAgcXVhbnRpbGVfZGVzYyA9IHF1YW50aWxlX3JhbmdlW21pbl9xXVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgXG4gICAgICBAJCgnLnNjZW5hcmlvUmVzdWx0cycpLmh0bWwgXCJcIlwiXG4gICAgICAgIDxhIGhyZWY9XCJodHRwOi8vd3d3LnVxLmVkdS5hdS9tYXJ4YW4vXCIgdGFyZ2V0PVwiX2JsYW5rXCIgPk1hcnhhbjwvYT4gaXMgY29uc2VydmF0aW9uIHBsYW5uaW5nIHNvZnR3YXJlIHRoYXQgcHJvdmlkZXMgZGVjaXNpb24gc3VwcG9ydCBmb3IgYSByYW5nZSBvZiBjb25zZXJ2YXRpb24gcGxhbm5pbmcgcHJvYmxlbXMuIFxuICAgICAgICBJbiB0aGlzIGFuYWx5c2lzLCB0aGUgZ29hbCBpcyB0byBtYXhpbWl6ZSB0aGUgYW1vdW50IG9mIGhhYml0YXQgY29uc2VydmVkLiBUaGUgc2NvcmUgZm9yIGEgMjAwIHNxdWFyZSBtZXRlciBwbGFubmluZyB1bml0IGlzIHRoZSBudW1iZXIgb2YgdGltZXMgaXQgaXMgc2VsZWN0ZWQgaW4gMTAwIHJ1bnMsIFxuICAgICAgICB3aXRoIGhpZ2hlciBzY29yZXMgaW5kaWNhdGluZyBncmVhdGVyIGNvbnNlcnZhdGlvbiB2YWx1ZS4gVGhlIGF2ZXJhZ2UgTWFyeGFuIHNjb3JlIGZvciB0aGlzIGNvbGxlY3Rpb24gaXMgPHN0cm9uZz4je2RhdGEuU0NPUkV9PC9zdHJvbmc+LCBwbGFjaW5nIGl0IGluIFxuICAgICAgICB0aGUgPHN0cm9uZz4je3F1YW50aWxlX2Rlc2N9PC9zdHJvbmc+IHF1YW50aWxlIHJhbmdlIDxzdHJvbmc+KCN7bWluX3EucmVwbGFjZSgnUScsICcnKX0lIC0gI3ttYXhfcS5yZXBsYWNlKCdRJywgJycpfSUpPC9zdHJvbmc+IFxuICAgICAgICBmb3IgdGhpcyByZWdpb24uIFRoZSBncmFwaCBiZWxvdyBzaG93cyB0aGUgZGlzdHJpYnV0aW9uIG9mIHNjb3JlcyBmb3IgYWxsIHBsYW5uaW5nIHVuaXRzIHdpdGhpbiB0aGlzIHByb2plY3QuXG4gICAgICBcIlwiXCJcblxuICAgICAgQCQoJy5zY2VuYXJpb0Rlc2NyaXB0aW9uJykuaHRtbCBkYXRhLk1BUlhfREVTQ1xuXG4gICAgICBkb21haW4gPSBfLm1hcCBxdWFudGlsZXMsIChxKSAtPiBkYXRhW3FdXG4gICAgICBkb21haW4ucHVzaCAxMDBcbiAgICAgIGRvbWFpbi51bnNoaWZ0IDBcbiAgICAgIGNvbG9yID0gZDMuc2NhbGUubGluZWFyKClcbiAgICAgICAgLmRvbWFpbihkb21haW4pXG4gICAgICAgIC5yYW5nZShbXCIjNDdhZTQzXCIsIFwiIzZjMFwiLCBcIiNlZTBcIiwgXCIjZWI0XCIsIFwiI2VjYmI4OVwiLCBcIiNlZWFiYTBcIl0ucmV2ZXJzZSgpKVxuICAgICAgcXVhbnRpbGVzID0gXy5tYXAgcXVhbnRpbGVzLCAoa2V5KSAtPlxuICAgICAgICBtYXggPSBwYXJzZUZsb2F0KGRhdGFba2V5XSlcbiAgICAgICAgbWluICA9IHBhcnNlRmxvYXQoZGF0YVtxdWFudGlsZXNbXy5pbmRleE9mKHF1YW50aWxlcywga2V5KSAtIDFdXSBvciAwKVxuICAgICAgICB7XG4gICAgICAgICAgcmFuZ2U6IFwiI3twYXJzZUludChrZXkucmVwbGFjZSgnUScsICcnKSkgLSAyMH0tI3trZXkucmVwbGFjZSgnUScsICcnKX0lXCJcbiAgICAgICAgICBuYW1lOiBrZXlcbiAgICAgICAgICBzdGFydDogbWluXG4gICAgICAgICAgZW5kOiBtYXhcbiAgICAgICAgICBiZzogY29sb3IoKG1heCArIG1pbikgLyAyKVxuICAgICAgICB9XG5cbiAgICAgIEAkKCcudml6JykuaHRtbCgnJylcbiAgICAgIGVsID0gQCQoJy52aXonKVswXVxuICAgICAgeCA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgICAgIC5kb21haW4oWzAsIDEwMF0pXG4gICAgICAgIC5yYW5nZShbMCwgNDAwXSkgICAgICBcblxuICAgICAgIyBIaXN0b2dyYW1cbiAgICAgIG1hcmdpbiA9IFxuICAgICAgICB0b3A6IDVcbiAgICAgICAgcmlnaHQ6IDIwXG4gICAgICAgIGJvdHRvbTogMzBcbiAgICAgICAgbGVmdDogNDVcbiAgICAgIHdpZHRoID0gNDAwIC0gbWFyZ2luLmxlZnQgLSBtYXJnaW4ucmlnaHRcbiAgICAgIGhlaWdodCA9IDMwMCAtIG1hcmdpbi50b3AgLSBtYXJnaW4uYm90dG9tXG4gICAgICBcbiAgICAgIHggPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgICAgICAuZG9tYWluKFswLCAxMDBdKVxuICAgICAgICAucmFuZ2UoWzAsIHdpZHRoXSlcbiAgICAgIHkgPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgICAgICAucmFuZ2UoW2hlaWdodCwgMF0pXG4gICAgICAgIC5kb21haW4oWzAsIGQzLm1heChoaXN0byldKVxuXG4gICAgICB4QXhpcyA9IGQzLnN2Zy5heGlzKClcbiAgICAgICAgLnNjYWxlKHgpXG4gICAgICAgIC5vcmllbnQoXCJib3R0b21cIilcbiAgICAgIHlBeGlzID0gZDMuc3ZnLmF4aXMoKVxuICAgICAgICAuc2NhbGUoeSlcbiAgICAgICAgLm9yaWVudChcImxlZnRcIilcblxuICAgICAgc3ZnID0gZDMuc2VsZWN0KEAkKCcudml6JylbMF0pLmFwcGVuZChcInN2Z1wiKVxuICAgICAgICAuYXR0cihcIndpZHRoXCIsIHdpZHRoICsgbWFyZ2luLmxlZnQgKyBtYXJnaW4ucmlnaHQpXG4gICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodCArIG1hcmdpbi50b3AgKyBtYXJnaW4uYm90dG9tKVxuICAgICAgLmFwcGVuZChcImdcIilcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoI3ttYXJnaW4ubGVmdH0sICN7bWFyZ2luLnRvcH0pXCIpXG5cbiAgICAgIHN2Zy5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ4IGF4aXNcIilcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMCwje2hlaWdodH0pXCIpXG4gICAgICAgIC5jYWxsKHhBeGlzKVxuICAgICAgLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIHdpZHRoIC8gMilcbiAgICAgICAgLmF0dHIoXCJkeVwiLCBcIjNlbVwiKVxuICAgICAgICAuc3R5bGUoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxuICAgICAgICAudGV4dChcIlNjb3JlXCIpXG5cbiAgICAgIHN2Zy5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ5IGF4aXNcIilcbiAgICAgICAgLmNhbGwoeUF4aXMpXG4gICAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInJvdGF0ZSgtOTApXCIpXG4gICAgICAgIC5hdHRyKFwieVwiLCA2KVxuICAgICAgICAuYXR0cihcImR5XCIsIFwiLjcxZW1cIilcbiAgICAgICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcbiAgICAgICAgLnRleHQoXCJOdW1iZXIgb2YgUGxhbm5pbmcgVW5pdHNcIilcblxuICAgICAgc3ZnLnNlbGVjdEFsbChcIi5iYXJcIilcbiAgICAgICAgICAuZGF0YShoaXN0bylcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwicmVjdFwiKVxuICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJiYXJcIilcbiAgICAgICAgICAuYXR0cihcInhcIiwgKGQsIGkpIC0+IHgoaSkpXG4gICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCAod2lkdGggLyAxMDApKVxuICAgICAgICAgIC5hdHRyKFwieVwiLCAoZCkgLT4geShkKSlcbiAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCAoZCkgLT4gaGVpZ2h0IC0geShkKSlcbiAgICAgICAgICAuc3R5bGUgJ2ZpbGwnLCAoZCwgaSkgLT5cbiAgICAgICAgICAgIHEgPSBfLmZpbmQgcXVhbnRpbGVzLCAocSkgLT5cbiAgICAgICAgICAgICAgaSA+PSBxLnN0YXJ0IGFuZCBpIDw9IHEuZW5kXG4gICAgICAgICAgICBxPy5iZyBvciBcInN0ZWVsYmx1ZVwiXG5cbiAgICAgIHN2Zy5zZWxlY3RBbGwoXCIuc2NvcmVcIilcbiAgICAgICAgICAuZGF0YShbTWF0aC5yb3VuZChkYXRhLlNDT1JFKV0pXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInNjb3JlXCIpXG4gICAgICAgIC5hdHRyKFwieFwiLCAoZCkgLT4gKHgoZCkgLSA4ICkrICdweCcpXG4gICAgICAgIC5hdHRyKFwieVwiLCAoZCkgLT4gKHkoaGlzdG9bZF0pIC0gMTApICsgJ3B4JylcbiAgICAgICAgLnRleHQoXCLilrxcIilcblxuICAgICAgc3ZnLnNlbGVjdEFsbChcIi5zY29yZVRleHRcIilcbiAgICAgICAgICAuZGF0YShbTWF0aC5yb3VuZChkYXRhLlNDT1JFKV0pXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInNjb3JlVGV4dFwiKVxuICAgICAgICAuYXR0cihcInhcIiwgKGQpIC0+ICh4KGQpIC0gNiApKyAncHgnKVxuICAgICAgICAuYXR0cihcInlcIiwgKGQpIC0+ICh5KGhpc3RvW2RdKSAtIDMwKSArICdweCcpXG4gICAgICAgIC50ZXh0KChkKSAtPiBkKVxuXG4gICAgICBAJCgnLnZpeicpLmFwcGVuZCAnPGRpdiBjbGFzcz1cImxlZ2VuZHNcIj48L2Rpdj4nXG4gICAgICBmb3IgcXVhbnRpbGUgaW4gcXVhbnRpbGVzXG4gICAgICAgIEAkKCcudml6IC5sZWdlbmRzJykuYXBwZW5kIFwiXCJcIlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJsZWdlbmRcIj48c3BhbiBzdHlsZT1cImJhY2tncm91bmQtY29sb3I6I3txdWFudGlsZS5iZ307XCI+Jm5ic3A7PC9zcGFuPiN7cXVhbnRpbGUucmFuZ2V9PC9kaXY+XG4gICAgICAgIFwiXCJcIlxuICAgICAgQCQoJy52aXonKS5hcHBlbmQgJzxiciBzdHlsZT1cImNsZWFyOmJvdGg7XCI+J1xubW9kdWxlLmV4cG9ydHMgPSBBcnJheUhhYml0YXRUYWIiLCJSZXBvcnRUYWIgPSByZXF1aXJlICdyZXBvcnRUYWInXG50ZW1wbGF0ZXMgPSByZXF1aXJlICcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuaWRzID0gcmVxdWlyZSAnLi9pZHMuY29mZmVlJ1xuZm9yIGtleSwgdmFsdWUgb2YgaWRzXG4gIHdpbmRvd1trZXldID0gdmFsdWVcblxucm91bmQgPSByZXF1aXJlKCdhcGkvdXRpbHMnKS5yb3VuZFxuVE9UQUxfQVJFQSA9IDE2NC44ICMgc3EgbWlsZXNcblRPVEFMX0xBR09PTl9BUkVBID0gMTEuMVxuX3BhcnRpYWxzID0gcmVxdWlyZSAnYXBpL3RlbXBsYXRlcydcbnBhcnRpYWxzID0gW11cbmZvciBrZXksIHZhbCBvZiBfcGFydGlhbHNcbiAgcGFydGlhbHNba2V5LnJlcGxhY2UoJ25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS8nLCAnJyldID0gdmFsXG5cbmNsYXNzIEFycmF5T3ZlcnZpZXdUYWIgZXh0ZW5kcyBSZXBvcnRUYWJcbiAgbmFtZTogJ092ZXJ2aWV3J1xuICBjbGFzc05hbWU6ICdvdmVydmlldydcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5hcnJheU92ZXJ2aWV3XG4gIGRlcGVuZGVuY2llczogWydEaWFtZXRlciddXG4gIHRpbWVvdXQ6IDEyMDAwMFxuXG4gIHJlbmRlcjogKCkgLT5cblxuICAgIHNhbmN0dWFyaWVzID0gW11cbiAgICBhcXVhY3VsdHVyZUFyZWFzID0gW11cbiAgICBtb29yaW5ncyA9IFtdXG4gICAgbm9OZXRab25lcyA9IFtdXG4gICAgZmlzaGluZ0FyZWFzID0gW11cblxuXG4gICAgc2FuY3R1YXJpZXMgPSBAZ2V0Q2hpbGRyZW4gU0FOQ1RVQVJZX0lEXG4gICAgbnVtU2FuY3R1YXJpZXMgPSBzYW5jdHVhcmllcy5sZW5ndGhcbiAgICBpZiBudW1TYW5jdHVhcmllcyA+IDBcbiAgICAgIHNhbmN0dWFyeU9jZWFuQXJlYSA9IEByZWNvcmRTZXQoXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgU0FOQ1RVQVJZX0lEXG4gICAgICApLmZsb2F0KCdPQ0VBTl9BUkVBJywgMSlcbiAgICAgIHNhbmN0dWFyeUxhZ29vbkFyZWEgPSBAcmVjb3JkU2V0KFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgIFNBTkNUVUFSWV9JRFxuICAgICAgKS5mbG9hdCgnTEFHT09OX0FSRUEnLCAxKVxuICAgICAgc2FuY3R1YXJ5T2NlYW5QZXJjZW50ID0gQHJlY29yZFNldChcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICBTQU5DVFVBUllfSURcbiAgICAgICkuZmxvYXQoJ09DRUFOX1BFUkNFTlQnLCAxKVxuICAgICAgc2FuY3R1YXJ5TGFnb29uUGVyY2VudCA9IEByZWNvcmRTZXQoXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgU0FOQ1RVQVJZX0lEXG4gICAgICApLmZsb2F0KCdMQUdPT05fUEVSQ0VOVCcsIDEpXG4gICAgZWxzZVxuICAgICAgc2FuY3R1YXJ5T2NlYW5BcmVhID0gMFxuICAgICAgc2FuY3R1YXJ5T2NlYW5QZXJjZW50ID0gMC4wXG4gICAgICBzYW5jdHVhcnlMYWdvb25BcmVhID0gMFxuICAgICAgc2FuY3R1YXJ5TGFnb29uUGVyY2VudCA9IDAuMFxuXG4gICAgYXF1YWN1bHR1cmVBcmVhcyA9IEBnZXRDaGlsZHJlbiBBUVVBQ1VMVFVSRV9JRFxuICAgIG51bUFxdWFjdWx0dXJlQXJlYXMgPSBhcXVhY3VsdHVyZUFyZWFzLmxlbmd0aFxuICAgIGlmIG51bUFxdWFjdWx0dXJlQXJlYXMgPiAwXG4gICAgICBhcXVhY3VsdHVyZU9jZWFuQXJlYSA9IEByZWNvcmRTZXQoXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgQVFVQUNVTFRVUkVfSURcbiAgICAgICkuZmxvYXQoJ09DRUFOX0FSRUEnLCAxKVxuICAgICAgYXF1YWN1bHR1cmVMYWdvb25BcmVhID0gQHJlY29yZFNldChcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICBBUVVBQ1VMVFVSRV9JRFxuICAgICAgKS5mbG9hdCgnTEFHT09OX0FSRUEnLCAxKVxuICAgICAgYXF1YWN1bHR1cmVPY2VhblBlcmNlbnQgPSBAcmVjb3JkU2V0KFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgIEFRVUFDVUxUVVJFX0lEXG4gICAgICApLmZsb2F0KCdPQ0VBTl9QRVJDRU5UJywgMSlcbiAgICAgIGFxdWFjdWx0dXJlTGFnb29uUGVyY2VudCA9IEByZWNvcmRTZXQoXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgQVFVQUNVTFRVUkVfSURcbiAgICAgICkuZmxvYXQoJ0xBR09PTl9QRVJDRU5UJywgMSlcbiAgICBlbHNlXG4gICAgICBhcXVhY3VsdHVyZU9jZWFuQXJlYSA9IDBcbiAgICAgIGFxdWFjdWx0dXJlT2NlYW5QZXJjZW50ID0gMC4wXG4gICAgICBhcXVhY3VsdHVyZUxhZ29vbkFyZWEgPSAwXG4gICAgICBhcXVhY3VsdHVyZUxhZ29vblBlcmNlbnQgPSAwLjBcblxuICAgIG1vb3JpbmdzID0gIEBnZXRDaGlsZHJlbiBNT09SSU5HX0lEXG4gICAgbnVtTW9vcmluZ3MgPSBtb29yaW5ncy5sZW5ndGhcbiAgICBpZiBudW1Nb29yaW5ncyA+IDBcbiAgICAgIG1vb3JpbmdzT2NlYW5BcmVhID0gQHJlY29yZFNldChcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICBNT09SSU5HX0lEXG4gICAgICApLmZsb2F0KCdPQ0VBTl9BUkVBJywgMSlcbiAgICAgIG1vb3JpbmdzTGFnb29uQXJlYSA9IEByZWNvcmRTZXQoXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgTU9PUklOR19JRFxuICAgICAgKS5mbG9hdCgnTEFHT09OX0FSRUEnLCAxKVxuICAgICAgbW9vcmluZ3NPY2VhblBlcmNlbnQgPSBAcmVjb3JkU2V0KFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgIE1PT1JJTkdfSURcbiAgICAgICkuZmxvYXQoJ09DRUFOX1BFUkNFTlQnLCAxKVxuICAgICAgbW9vcmluZ3NMYWdvb25QZXJjZW50ID0gQHJlY29yZFNldChcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICBNT09SSU5HX0lEXG4gICAgICApLmZsb2F0KCdMQUdPT05fUEVSQ0VOVCcsIDEpXG4gICAgZWxzZVxuICAgICAgbW9vcmluZ3NPY2VhbkFyZWEgPSAwXG4gICAgICBtb29yaW5nc09jZWFuUGVyY2VudCA9IDAuMFxuICAgICAgbW9vcmluZ3NMYWdvb25BcmVhID0gMFxuICAgICAgbW9vcmluZ3NMYWdvb25QZXJjZW50ID0gMC4wXG5cbiAgICBub05ldFpvbmVzID0gQGdldENoaWxkcmVuIE5PX05FVF9aT05FU19JRFxuICAgIG51bU5vTmV0Wm9uZXMgPSBub05ldFpvbmVzLmxlbmd0aFxuICAgIGlmIG51bU5vTmV0Wm9uZXMgPiAwXG4gICAgICBub05ldFpvbmVzT2NlYW5BcmVhID0gQHJlY29yZFNldChcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICBOT19ORVRfWk9ORVNfSURcbiAgICAgICkuZmxvYXQoJ09DRUFOX0FSRUEnLCAxKVxuICAgICAgbm9OZXRab25lc0xhZ29vbkFyZWEgPSBAcmVjb3JkU2V0KFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgIE5PX05FVF9aT05FU19JRFxuICAgICAgKS5mbG9hdCgnTEFHT09OX0FSRUEnLCAxKSBcbiAgICAgIG5vTmV0Wm9uZXNPY2VhblBlcmNlbnQgPSBAcmVjb3JkU2V0KFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgJ0RpYW1ldGVyJywgXG4gICAgICAgIE5PX05FVF9aT05FU19JRFxuICAgICAgKS5mbG9hdCgnT0NFQU5fUEVSQ0VOVCcsIDEpXG4gICAgICBub05ldFpvbmVzTGFnb29uUGVyY2VudCA9IEByZWNvcmRTZXQoXG4gICAgICAgICdEaWFtZXRlcicsIFxuICAgICAgICAnRGlhbWV0ZXInLCBcbiAgICAgICAgTk9fTkVUX1pPTkVTX0lEXG4gICAgICApLmZsb2F0KCdMQUdPT05fUEVSQ0VOVCcsIDEpIFxuICAgIGVsc2VcbiAgICAgIG5vTmV0Wm9uZXNPY2VhbkFyZWEgPSAwXG4gICAgICBub05ldFpvbmVzT2NlYW5QZXJjZW50ID0gMC4wXG4gICAgICBub05ldFpvbmVzTGFnb29uQXJlYSA9IDBcbiAgICAgIG5vTmV0Wm9uZXNMYWdvb25QZXJjZW50ID0gMC4wXG5cblxuICAgIG51bVRvdGFsWm9uZXMgPSBudW1TYW5jdHVhcmllcytudW1Ob05ldFpvbmVzK251bUFxdWFjdWx0dXJlQXJlYXMrbnVtTW9vcmluZ3NcbiAgICBzdW1PY2VhbkFyZWEgPSByb3VuZChzYW5jdHVhcnlPY2VhbkFyZWErbm9OZXRab25lc09jZWFuQXJlYSthcXVhY3VsdHVyZU9jZWFuQXJlYSttb29yaW5nc09jZWFuQXJlYSwgMSlcbiAgICBzdW1PY2VhblBlcmNlbnQgPSByb3VuZChzYW5jdHVhcnlPY2VhblBlcmNlbnQrbm9OZXRab25lc09jZWFuUGVyY2VudCthcXVhY3VsdHVyZU9jZWFuUGVyY2VudCttb29yaW5nc09jZWFuUGVyY2VudCwwKVxuICAgIHN1bUxhZ29vbkFyZWEgPSByb3VuZChzYW5jdHVhcnlMYWdvb25BcmVhK25vTmV0Wm9uZXNMYWdvb25BcmVhK2FxdWFjdWx0dXJlTGFnb29uQXJlYSttb29yaW5nc0xhZ29vbkFyZWEsIDEpXG4gICAgc3VtTGFnb29uUGVyY2VudCA9IHJvdW5kKHNhbmN0dWFyeUxhZ29vblBlcmNlbnQrbm9OZXRab25lc0xhZ29vblBlcmNlbnQrYXF1YWN1bHR1cmVMYWdvb25QZXJjZW50K21vb3JpbmdzTGFnb29uUGVyY2VudCwgMClcbiAgICBoYXNTa2V0Y2hlcyA9IG51bVRvdGFsWm9uZXMgPiAwXG5cbiAgICBjb250ZXh0ID1cbiAgICAgIHNrZXRjaDogQG1vZGVsLmZvclRlbXBsYXRlKClcbiAgICAgIHNrZXRjaENsYXNzOiBAc2tldGNoQ2xhc3MuZm9yVGVtcGxhdGUoKVxuICAgICAgYXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKVxuICAgICAgYW55QXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKS5sZW5ndGggPiAwXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuXG4gICAgICBudW1TYW5jdHVhcmllczogc2FuY3R1YXJpZXMubGVuZ3RoXG4gICAgICBoYXNTYW5jdHVhcmllczogc2FuY3R1YXJpZXMubGVuZ3RoID4gMFxuICAgICAgc2FuY3R1YXJpZXNQbHVyYWw6IHNhbmN0dWFyaWVzLmxlbmd0aCA+IDFcbiAgICAgIHNhbmN0dWFyeU9jZWFuUGVyY2VudDogcm91bmQoc2FuY3R1YXJ5T2NlYW5QZXJjZW50LCAyKVxuICAgICAgc2FuY3R1YXJ5T2NlYW5BcmVhOiByb3VuZChzYW5jdHVhcnlPY2VhbkFyZWEsIDEpXG4gICAgICBzYW5jdHVhcnlMYWdvb25BcmVhOiByb3VuZChzYW5jdHVhcnlMYWdvb25BcmVhLCAyKVxuICAgICAgc2FuY3R1YXJ5TGFnb29uUGVyY2VudDogcm91bmQoc2FuY3R1YXJ5TGFnb29uUGVyY2VudCwgMSlcbiAgICAgIFxuICAgICAgbnVtTm9OZXRab25lczogbm9OZXRab25lcy5sZW5ndGhcbiAgICAgIGhhc05vTmV0Wm9uZXM6IG5vTmV0Wm9uZXMubGVuZ3RoID4gMFxuICAgICAgbm9OZXRab25lc1BsdXJhbDogbm9OZXRab25lcy5sZW5ndGggPiAxXG4gICAgICBub05ldFpvbmVzT2NlYW5QZXJjZW50OiByb3VuZChub05ldFpvbmVzT2NlYW5QZXJjZW50LCAyKVxuICAgICAgbm9OZXRab25lc09jZWFuQXJlYTogcm91bmQobm9OZXRab25lc09jZWFuQXJlYSwgMSlcbiAgICAgIG5vTmV0Wm9uZXNMYWdvb25BcmVhOiByb3VuZChub05ldFpvbmVzTGFnb29uQXJlYSwgMilcbiAgICAgIG5vTmV0Wm9uZXNMYWdvb25QZXJjZW50OiByb3VuZChub05ldFpvbmVzTGFnb29uUGVyY2VudCwgMSlcblxuICAgICAgbnVtQXF1YWN1bHR1cmU6IGFxdWFjdWx0dXJlQXJlYXMubGVuZ3RoXG4gICAgICBoYXNBcXVhY3VsdHVyZTogYXF1YWN1bHR1cmVBcmVhcy5sZW5ndGggPiAwXG4gICAgICBhcXVhY3VsdHVyZVBsdXJhbDogYXF1YWN1bHR1cmVBcmVhcy5sZW5ndGggPiAxXG4gICAgICBhcXVhY3VsdHVyZU9jZWFuUGVyY2VudDogcm91bmQoYXF1YWN1bHR1cmVPY2VhblBlcmNlbnQsIDIpXG4gICAgICBhcXVhY3VsdHVyZU9jZWFuQXJlYTogcm91bmQoYXF1YWN1bHR1cmVPY2VhbkFyZWEsIDEpXG4gICAgICBhcXVhY3VsdHVyZUxhZ29vbkFyZWE6IHJvdW5kKGFxdWFjdWx0dXJlTGFnb29uQXJlYSwgMilcbiAgICAgIGFxdWFjdWx0dXJlTGFnb29uUGVyY2VudDogcm91bmQoYXF1YWN1bHR1cmVMYWdvb25QZXJjZW50LCAxKVxuXG4gICAgICBudW1Nb29yaW5nczogbW9vcmluZ3MubGVuZ3RoXG4gICAgICBoYXNNb29yaW5nczogbW9vcmluZ3MubGVuZ3RoID4gMFxuICAgICAgbW9vcmluZ3NQbHVyYWw6IG1vb3JpbmdzLmxlbmd0aCA+IDFcbiAgICAgIG1vb3JpbmdzT2NlYW5QZXJjZW50OiByb3VuZChtb29yaW5nc09jZWFuUGVyY2VudCwgMilcbiAgICAgIG1vb3JpbmdzT2NlYW5BcmVhOiByb3VuZChtb29yaW5nc09jZWFuQXJlYSwgMSlcbiAgICAgIG1vb3JpbmdzTGFnb29uQXJlYTogcm91bmQobW9vcmluZ3NMYWdvb25BcmVhLCAyKVxuICAgICAgbW9vcmluZ3NMYWdvb25QZXJjZW50OiByb3VuZChtb29yaW5nc0xhZ29vblBlcmNlbnQsIDEpXG5cblxuICAgICAgaGFzU2tldGNoZXM6IGhhc1NrZXRjaGVzXG4gICAgICBza2V0Y2hlc1BsdXJhbDogbnVtVG90YWxab25lcyA+IDFcbiAgICAgIG51bVNrZXRjaGVzOiBudW1Ub3RhbFpvbmVzXG4gICAgICBzdW1PY2VhbkFyZWE6IHN1bU9jZWFuQXJlYVxuICAgICAgc3VtT2NlYW5QZXJjZW50OiBzdW1PY2VhblBlcmNlbnRcbiAgICAgIHN1bUxhZ29vblBlcmNlbnQ6IHN1bUxhZ29vblBlcmNlbnRcbiAgICAgIHN1bUxhZ29vbkFyZWE6IHN1bUxhZ29vbkFyZWFcbiAgICBcbiAgICBAJGVsLmh0bWwgQHRlbXBsYXRlLnJlbmRlcihjb250ZXh0LCBwYXJ0aWFscylcblxuICAgICMgbm9kZXMgPSBbQG1vZGVsXVxuICAgICMgQG1vZGVsLnNldCAnb3BlbicsIHRydWVcbiAgICAjIG5vZGVzID0gbm9kZXMuY29uY2F0IEBjaGlsZHJlblxuICAgICMgY29uc29sZS5sb2cgJ25vZGVzJywgbm9kZXMsICdjaGlsZHJlbicsIEBjaGlsZHJlblxuICAgICMgZm9yIG5vZGUgaW4gbm9kZXNcbiAgICAjICAgbm9kZS5zZXQgJ3NlbGVjdGVkJywgZmFsc2VcbiAgICAjIFRhYmxlT2ZDb250ZW50cyA9IHdpbmRvdy5yZXF1aXJlKCd2aWV3cy90YWJsZU9mQ29udGVudHMnKVxuICAgICMgQHRvYyA9IG5ldyBUYWJsZU9mQ29udGVudHMobm9kZXMpXG4gICAgIyBAJCgnLnRvY0NvbnRhaW5lcicpLmFwcGVuZCBAdG9jLmVsXG4gICAgIyBAdG9jLnJlbmRlcigpXG5cbiAgcmVtb3ZlOiAoKSAtPlxuICAgIEB0b2M/LnJlbW92ZSgpXG4gICAgc3VwZXIoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEFycmF5T3ZlcnZpZXdUYWIiLCJSZXBvcnRUYWIgPSByZXF1aXJlICdyZXBvcnRUYWInXG50ZW1wbGF0ZXMgPSByZXF1aXJlICcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xucm91bmQgPSByZXF1aXJlKCdhcGkvdXRpbHMnKS5yb3VuZFxuVE9UQUxfQVJFQSA9IDE2NC44ICMgc3EgbWlsZXNcblRPVEFMX0xBR09PTl9BUkVBID0gMTEuMVxuX3BhcnRpYWxzID0gcmVxdWlyZSAnYXBpL3RlbXBsYXRlcydcbnBhcnRpYWxzID0gW11cbmZvciBrZXksIHZhbCBvZiBfcGFydGlhbHNcbiAgcGFydGlhbHNba2V5LnJlcGxhY2UoJ25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS8nLCAnJyldID0gdmFsXG5cbmNsYXNzIEFycmF5VHJhZGVvZmZzVGFiIGV4dGVuZHMgUmVwb3J0VGFiXG4gIG5hbWU6ICdUcmFkZW9mZnMnXG4gIGNsYXNzTmFtZTogJ3RyYWRlb2ZmcydcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5hcnJheVRyYWRlb2Zmc1xuICBkZXBlbmRlbmNpZXM6IFsnVHJhZGVvZmZzUHJvcElkJ11cbiAgdGltZW91dDogMTIwMDAwXG5cblxuICByZW5kZXI6ICgpIC0+XG4gICAgICBcbiAgICB0cmFkZW9mZl9kYXRhID0gQHJlY29yZFNldCgnVHJhZGVvZmZzUHJvcElkJywgJ1RyYWRlb2Zmc1Byb3BJZCcpLnRvQXJyYXkoKVxuICAgIGNvbnRleHQgPVxuICAgICAgc2tldGNoOiBAbW9kZWwuZm9yVGVtcGxhdGUoKVxuICAgICAgc2tldGNoQ2xhc3M6IEBza2V0Y2hDbGFzcy5mb3JUZW1wbGF0ZSgpXG4gICAgICBhdHRyaWJ1dGVzOiBAbW9kZWwuZ2V0QXR0cmlidXRlcygpXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHBhcnRpYWxzKVxuXG4gICAgaWYgd2luZG93LmQzXG5cbiAgICAgIGggPSAzODBcbiAgICAgIHcgPSAzODBcbiAgICAgIG1hcmdpbiA9IHtsZWZ0OjQwLCB0b3A6NSwgcmlnaHQ6NDAsIGJvdHRvbTogNDAsIGlubmVyOjV9XG4gICAgICBoYWxmaCA9IChoK21hcmdpbi50b3ArbWFyZ2luLmJvdHRvbSlcbiAgICAgIHRvdGFsaCA9IGhhbGZoKjJcbiAgICAgIGhhbGZ3ID0gKHcrbWFyZ2luLmxlZnQrbWFyZ2luLnJpZ2h0KVxuICAgICAgdG90YWx3ID0gaGFsZncqMlxuXG4gICAgICAjbWFrZSBzdXJlIGl0cyBAc2NhdHRlcnBsb3QgdG8gcGFzcyBpbiB0aGUgcmlnaHQgY29udGV4dCAodGFiKSBmb3IgZDNcbiAgICAgIG15Y2hhcnQgPSBAc2NhdHRlcnBsb3QoKS54dmFyKDApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIC55dmFyKDEpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIC54bGFiKFwiRmlzaGluZyBWYWx1ZVwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAueWxhYihcIkVjb2xvZ2ljYWwgVmFsdWVcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmhlaWdodChoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAud2lkdGgodylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcmdpbihtYXJnaW4pXG5cblxuICAgICAgY2ggPSBkMy5zZWxlY3QoQCQoJy50cmFkZW9mZi1jaGFydCcpKVxuICAgICAgY2guZGF0dW0odHJhZGVvZmZfZGF0YSlcbiAgICAgICAgLmNhbGwobXljaGFydClcblxuICAgICAgdG9vbHRpcCA9IGQzLnNlbGVjdChcImJvZHlcIilcbiAgICAgICAgLmFwcGVuZChcImRpdlwiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiY2hhcnQtdG9vbHRpcFwiKVxuICAgICAgICAuYXR0cihcImlkXCIsIFwiY2hhcnQtdG9vbHRpcFwiKVxuICAgICAgICAudGV4dChcImRhdGFcIilcblxuICAgICAgbXljaGFydC5wb2ludHNTZWxlY3QoKVxuICAgICAgICAub24gXCJtb3VzZW92ZXJcIiwgKGQpIC0+IHJldHVybiB0b29sdGlwLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcInZpc2libGVcIikuaHRtbChcIjx1bD48c3Ryb25nPlByb3Bvc2FsOiBcIit3aW5kb3cuYXBwLnNrZXRjaGVzLmdldChkLlBST1BPU0FMKS5hdHRyaWJ1dGVzLm5hbWUrXCI8L3N0cm9uZz48bGk+IEZpc2hpbmcgdmFsdWU6IFwiK2QuRklTSF9WQUwrXCI8L2xpPjxsaT4gQ29uc2VydmF0aW9uIHZhbHVlOiBcIitkLkVDT19WQUwrXCI8L2xpPjwvdWw+XCIpXG5cbiAgICAgIG15Y2hhcnQucG9pbnRzU2VsZWN0KClcbiAgICAgICAgLm9uIFwibW91c2Vtb3ZlXCIsIChkKSAtPiByZXR1cm4gdG9vbHRpcC5zdHlsZShcInRvcFwiLCAoZXZlbnQucGFnZVktMTApK1wicHhcIikuc3R5bGUoXCJsZWZ0XCIsKGNhbGNfdHRpcChldmVudC5wYWdlWCwgZCwgdG9vbHRpcCkpK1wicHhcIilcblxuICAgICAgbXljaGFydC5wb2ludHNTZWxlY3QoKVxuICAgICAgICAub24gXCJtb3VzZW91dFwiLCAoZCkgLT4gcmV0dXJuIHRvb2x0aXAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpXG5cbiAgICAgIG15Y2hhcnQubGFiZWxzU2VsZWN0KClcbiAgICAgICAgLm9uIFwibW91c2VvdmVyXCIsIChkKSAtPiByZXR1cm4gdG9vbHRpcC5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJ2aXNpYmxlXCIpLmh0bWwoXCI8dWw+PHN0cm9uZz5Qcm9wb3NhbDogXCIrd2luZG93LmFwcC5za2V0Y2hlcy5nZXQoZC5QUk9QT1NBTCkuYXR0cmlidXRlcy5uYW1lK1wiPC9zdHJvbmc+PGxpPiBGaXNoaW5nIHZhbHVlOiBcIitkLkZJU0hfVkFMK1wiPC9saT48bGk+IENvbnNlcnZhdGlvbiB2YWx1ZTogXCIrZC5FQ09fVkFMK1wiPC9saT48L3VsPlwiKVxuXG4gICAgICBteWNoYXJ0LmxhYmVsc1NlbGVjdCgpXG4gICAgICAgIC5vbiBcIm1vdXNlbW92ZVwiLCAoZCkgLT4gcmV0dXJuIHRvb2x0aXAuc3R5bGUoXCJ0b3BcIiwgKGV2ZW50LnBhZ2VZLTEwKStcInB4XCIpLnN0eWxlKFwibGVmdFwiLChjYWxjX3R0aXAoZXZlbnQucGFnZVgsIGQsIHRvb2x0aXApKStcInB4XCIpXG5cbiAgICAgIG15Y2hhcnQubGFiZWxzU2VsZWN0KClcbiAgICAgICAgLm9uIFwibW91c2VvdXRcIiwgKGQpIC0+IHJldHVybiB0b29sdGlwLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcImhpZGRlblwiKVxuXG4gIGNhbGNfdHRpcCA9ICh4bG9jLCBkYXRhLCB0b29sdGlwKSAtPlxuICAgIHRkaXYgPSB0b29sdGlwWzBdWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgdGxlZnQgPSB0ZGl2LmxlZnRcbiAgICB0dyA9IHRkaXYud2lkdGhcbiAgICByZXR1cm4geGxvYy0odHcrMTApIGlmICh4bG9jK3R3ID4gdGxlZnQrdHcpXG4gICAgcmV0dXJuIHhsb2MrMTBcblxuXG4gIHNjYXR0ZXJwbG90OiAoKSA9PlxuICAgIHZpZXcgPSBAXG4gICAgd2lkdGggPSAzODBcbiAgICBoZWlnaHQgPSA2MDBcbiAgICBtYXJnaW4gPSB7bGVmdDo0MCwgdG9wOjUsIHJpZ2h0OjQwLCBib3R0b206IDQwLCBpbm5lcjo1fVxuICAgIGF4aXNwb3MgPSB7eHRpdGxlOjI1LCB5dGl0bGU6MzAsIHhsYWJlbDo1LCB5bGFiZWw6NX1cbiAgICB4bGltID0gbnVsbFxuICAgIHlsaW0gPSBudWxsXG4gICAgbnh0aWNrcyA9IDVcbiAgICB4dGlja3MgPSBudWxsXG4gICAgbnl0aWNrcyA9IDVcbiAgICB5dGlja3MgPSBudWxsXG4gICAgI3JlY3Rjb2xvciA9IGQzLnJnYigyMzAsIDIzMCwgMjMwKVxuICAgIHJlY3Rjb2xvciA9IFwiI2RiZTRlZVwiXG4gICAgcG9pbnRzaXplID0gNSAjIGRlZmF1bHQgPSBubyB2aXNpYmxlIHBvaW50cyBhdCBtYXJrZXJzXG4gICAgeGxhYiA9IFwiWFwiXG4gICAgeWxhYiA9IFwiWSBzY29yZVwiXG4gICAgeXNjYWxlID0gZDMuc2NhbGUubGluZWFyKClcbiAgICB4c2NhbGUgPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgIGxlZ2VuZGhlaWdodCA9IDMwMFxuICAgIHBvaW50c1NlbGVjdCA9IG51bGxcbiAgICBsYWJlbHNTZWxlY3QgPSBudWxsXG4gICAgbGVnZW5kU2VsZWN0ID0gbnVsbFxuICAgIGlmIHdpbmRvdy5kM1xuICAgICAgI2NsZWFyIG91dCB0aGUgb2xkIHZhbHVlc1xuICAgICAgdmlldy4kKCcudHJhZGVvZmYtY2hhcnQnKS5odG1sKCcnKVxuICAgICAgZWwgPSB2aWV3LiQoJy50cmFkZW9mZi1jaGFydCcpWzBdXG5cbiAgICAjIyB0aGUgbWFpbiBmdW5jdGlvblxuICAgIGNoYXJ0ID0gKHNlbGVjdGlvbikgLT5cbiAgICAgIHNlbGVjdGlvbi5lYWNoIChkYXRhKSAtPlxuICAgICAgICB4ID0gZGF0YS5tYXAgKGQpIC0+IHBhcnNlRmxvYXQoZC5GSVNIX1ZBTClcbiAgICAgICAgeSA9IGRhdGEubWFwIChkKSAtPiBwYXJzZUZsb2F0KGQuRUNPX1ZBTClcblxuXG4gICAgICAgIHBhbmVsb2Zmc2V0ID0gMFxuICAgICAgICBwYW5lbHdpZHRoID0gd2lkdGhcblxuICAgICAgICBwYW5lbGhlaWdodCA9IGhlaWdodFxuXG4gICAgICAgIHhsaW0gPSBbZDMubWluKHgpLTIsIHBhcnNlRmxvYXQoZDMubWF4KHgpKzIpXSBpZiAhKHhsaW0/KVxuXG4gICAgICAgIHlsaW0gPSBbZDMubWluKHkpLTIsIHBhcnNlRmxvYXQoZDMubWF4KHkpKzIpXSBpZiAhKHlsaW0/KVxuXG4gICAgICAgICMgSSdsbCByZXBsYWNlIG1pc3NpbmcgdmFsdWVzIHNvbWV0aGluZyBzbWFsbGVyIHRoYW4gd2hhdCdzIG9ic2VydmVkXG4gICAgICAgIG5hX3ZhbHVlID0gZDMubWluKHguY29uY2F0IHkpIC0gMTAwXG4gICAgICAgIGN1cnJlbGVtID0gZDMuc2VsZWN0KHZpZXcuJCgnLnRyYWRlb2ZmLWNoYXJ0JylbMF0pXG4gICAgICAgIHN2ZyA9IGQzLnNlbGVjdCh2aWV3LiQoJy50cmFkZW9mZi1jaGFydCcpWzBdKS5hcHBlbmQoXCJzdmdcIikuZGF0YShbZGF0YV0pXG4gICAgICAgIHN2Zy5hcHBlbmQoXCJnXCIpXG5cbiAgICAgICAgIyBVcGRhdGUgdGhlIG91dGVyIGRpbWVuc2lvbnMuXG4gICAgICAgIHN2Zy5hdHRyKFwid2lkdGhcIiwgd2lkdGgrbWFyZ2luLmxlZnQrbWFyZ2luLnJpZ2h0KVxuICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQrbWFyZ2luLnRvcCttYXJnaW4uYm90dG9tK2RhdGEubGVuZ3RoKjM1KVxuXG4gICAgICAgIGcgPSBzdmcuc2VsZWN0KFwiZ1wiKVxuXG4gICAgICAgICMgYm94XG4gICAgICAgIGcuYXBwZW5kKFwicmVjdFwiKVxuICAgICAgICAgLmF0dHIoXCJ4XCIsIHBhbmVsb2Zmc2V0K21hcmdpbi5sZWZ0KVxuICAgICAgICAgLmF0dHIoXCJ5XCIsIG1hcmdpbi50b3ApXG4gICAgICAgICAuYXR0cihcImhlaWdodFwiLCBwYW5lbGhlaWdodClcbiAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgcGFuZWx3aWR0aClcbiAgICAgICAgIC5hdHRyKFwiZmlsbFwiLCByZWN0Y29sb3IpXG4gICAgICAgICAuYXR0cihcInN0cm9rZVwiLCBcIm5vbmVcIilcblxuXG4gICAgICAgICMgc2ltcGxlIHNjYWxlcyAoaWdub3JlIE5BIGJ1c2luZXNzKVxuICAgICAgICB4cmFuZ2UgPSBbbWFyZ2luLmxlZnQrcGFuZWxvZmZzZXQrbWFyZ2luLmlubmVyLCBtYXJnaW4ubGVmdCtwYW5lbG9mZnNldCtwYW5lbHdpZHRoLW1hcmdpbi5pbm5lcl1cbiAgICAgICAgeXJhbmdlID0gW21hcmdpbi50b3ArcGFuZWxoZWlnaHQtbWFyZ2luLmlubmVyLCBtYXJnaW4udG9wK21hcmdpbi5pbm5lcl1cbiAgICAgICAgeHNjYWxlLmRvbWFpbih4bGltKS5yYW5nZSh4cmFuZ2UpXG4gICAgICAgIHlzY2FsZS5kb21haW4oeWxpbSkucmFuZ2UoeXJhbmdlKVxuICAgICAgICB4cyA9IGQzLnNjYWxlLmxpbmVhcigpLmRvbWFpbih4bGltKS5yYW5nZSh4cmFuZ2UpXG4gICAgICAgIHlzID0gZDMuc2NhbGUubGluZWFyKCkuZG9tYWluKHlsaW0pLnJhbmdlKHlyYW5nZSlcblxuXG4gICAgICAgICMgaWYgeXRpY2tzIG5vdCBwcm92aWRlZCwgdXNlIG55dGlja3MgdG8gY2hvb3NlIHByZXR0eSBvbmVzXG4gICAgICAgIHl0aWNrcyA9IHlzLnRpY2tzKG55dGlja3MpIGlmICEoeXRpY2tzPylcbiAgICAgICAgeHRpY2tzID0geHMudGlja3Mobnh0aWNrcykgaWYgISh4dGlja3M/KVxuXG4gICAgICAgICMgeC1heGlzXG4gICAgICAgIHhheGlzID0gZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJjbGFzc1wiLCBcInggYXhpc1wiKVxuICAgICAgICB4YXhpcy5zZWxlY3RBbGwoXCJlbXB0eVwiKVxuICAgICAgICAgICAgIC5kYXRhKHh0aWNrcylcbiAgICAgICAgICAgICAuZW50ZXIoKVxuICAgICAgICAgICAgIC5hcHBlbmQoXCJsaW5lXCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJ4MVwiLCAoZCkgLT4geHNjYWxlKGQpKVxuICAgICAgICAgICAgIC5hdHRyKFwieDJcIiwgKGQpIC0+IHhzY2FsZShkKSlcbiAgICAgICAgICAgICAuYXR0cihcInkxXCIsIG1hcmdpbi50b3ApXG4gICAgICAgICAgICAgLmF0dHIoXCJ5MlwiLCBtYXJnaW4udG9wK2hlaWdodClcbiAgICAgICAgICAgICAuYXR0cihcImZpbGxcIiwgXCJub25lXCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJzdHJva2VcIiwgXCJ3aGl0ZVwiKVxuICAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlLXdpZHRoXCIsIDEpXG4gICAgICAgICAgICAgLnN0eWxlKFwicG9pbnRlci1ldmVudHNcIiwgXCJub25lXCIpXG4gICAgICAgIHhheGlzLnNlbGVjdEFsbChcImVtcHR5XCIpXG4gICAgICAgICAgICAgLmRhdGEoeHRpY2tzKVxuICAgICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgICAgLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgICAgICAuYXR0cihcInhcIiwgKGQpIC0+IHhzY2FsZShkKSlcbiAgICAgICAgICAgICAuYXR0cihcInlcIiwgbWFyZ2luLnRvcCtoZWlnaHQrYXhpc3Bvcy54bGFiZWwpXG4gICAgICAgICAgICAgLnRleHQoKGQpIC0+IGZvcm1hdEF4aXMoeHRpY2tzKShkKSlcbiAgICAgICAgeGF4aXMuYXBwZW5kKFwidGV4dFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJ4YXhpcy10aXRsZVwiKVxuICAgICAgICAgICAgIC5hdHRyKFwieFwiLCBtYXJnaW4ubGVmdCt3aWR0aC8yKVxuICAgICAgICAgICAgIC5hdHRyKFwieVwiLCBtYXJnaW4udG9wK2hlaWdodCtheGlzcG9zLnh0aXRsZSlcbiAgICAgICAgICAgICAudGV4dCh4bGFiKVxuICAgICAgICB4YXhpcy5zZWxlY3RBbGwoXCJlbXB0eVwiKVxuICAgICAgICAgICAgIC5kYXRhKGRhdGEpXG4gICAgICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAgICAuYXBwZW5kKFwiY2lyY2xlXCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJjeFwiLCAoZCxpKSAtPiBtYXJnaW4ubGVmdClcbiAgICAgICAgICAgICAuYXR0cihcImN5XCIsIChkLGkpIC0+IG1hcmdpbi50b3AraGVpZ2h0K2F4aXNwb3MueHRpdGxlKygoaSsxKSozMCkrNilcbiAgICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIChkLGkpIC0+IFwicHQje2l9XCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJyXCIsIHBvaW50c2l6ZSlcbiAgICAgICAgICAgICAuYXR0cihcImZpbGxcIiwgKGQsaSkgLT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsID0gaSAlIDE3XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbCA9IGdldENvbG9ycyh2YWwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb2xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIChkLCBpKSAtPlxuICAgICAgICAgICAgICAgICAgICAgICAgICB2YWwgPSBNYXRoLmZsb29yKGkvMTcpICUgNVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb2wgPSBnZXRTdHJva2VDb2xvcih2YWwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb2xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlLXdpZHRoXCIsIFwiMVwiKVxuXG4gICAgICAgIHhheGlzLnNlbGVjdEFsbChcImVtcHR5XCIpXG4gICAgICAgICAgICAgLmRhdGEoZGF0YSlcbiAgICAgICAgICAgICAuZW50ZXIoKVxuICAgICAgICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImxlZ2VuZC10ZXh0XCIpXG5cbiAgICAgICAgICAgICAuYXR0cihcInhcIiwgKGQsaSkgLT5cbiAgICAgICAgICAgICAgICByZXR1cm4gbWFyZ2luLmxlZnQrMjApXG4gICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIChkLGkpIC0+XG4gICAgICAgICAgICAgICAgbWFyZ2luLnRvcCtoZWlnaHQrYXhpc3Bvcy54dGl0bGUrKChpKzEpKjMwKSlcbiAgICAgICAgICAgICAudGV4dCgoZCkgLT4gcmV0dXJuIHdpbmRvdy5hcHAuc2tldGNoZXMuZ2V0KGQuUFJPUE9TQUwpLmF0dHJpYnV0ZXMubmFtZSlcbiAgICAgICAgIyB5LWF4aXNcbiAgICAgICAgeWF4aXMgPSBnLmFwcGVuZChcImdcIikuYXR0cihcImNsYXNzXCIsIFwieSBheGlzXCIpXG4gICAgICAgIHlheGlzLnNlbGVjdEFsbChcImVtcHR5XCIpXG4gICAgICAgICAgICAgLmRhdGEoeXRpY2tzKVxuICAgICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgICAgLmFwcGVuZChcImxpbmVcIilcbiAgICAgICAgICAgICAuYXR0cihcInkxXCIsIChkKSAtPiB5c2NhbGUoZCkpXG4gICAgICAgICAgICAgLmF0dHIoXCJ5MlwiLCAoZCkgLT4geXNjYWxlKGQpKVxuICAgICAgICAgICAgIC5hdHRyKFwieDFcIiwgbWFyZ2luLmxlZnQpXG4gICAgICAgICAgICAgLmF0dHIoXCJ4MlwiLCBtYXJnaW4ubGVmdCt3aWR0aClcbiAgICAgICAgICAgICAuYXR0cihcImZpbGxcIiwgXCJub25lXCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJzdHJva2VcIiwgXCJ3aGl0ZVwiKVxuICAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlLXdpZHRoXCIsIDEpXG4gICAgICAgICAgICAgLnN0eWxlKFwicG9pbnRlci1ldmVudHNcIiwgXCJub25lXCIpXG4gICAgICAgIHlheGlzLnNlbGVjdEFsbChcImVtcHR5XCIpXG4gICAgICAgICAgICAgLmRhdGEoeXRpY2tzKVxuICAgICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgICAgLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgICAgICAuYXR0cihcInlcIiwgKGQpIC0+IHlzY2FsZShkKSlcbiAgICAgICAgICAgICAuYXR0cihcInhcIiwgbWFyZ2luLmxlZnQtYXhpc3Bvcy55bGFiZWwpXG4gICAgICAgICAgICAgLnRleHQoKGQpIC0+IGZvcm1hdEF4aXMoeXRpY2tzKShkKSlcbiAgICAgICAgeWF4aXMuYXBwZW5kKFwidGV4dFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJ0aXRsZVwiKVxuICAgICAgICAgICAgIC5hdHRyKFwieVwiLCBtYXJnaW4udG9wK2hlaWdodC8yKVxuICAgICAgICAgICAgIC5hdHRyKFwieFwiLCBtYXJnaW4ubGVmdC1heGlzcG9zLnl0aXRsZSlcbiAgICAgICAgICAgICAudGV4dCh5bGFiKVxuICAgICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwicm90YXRlKDI3MCwje21hcmdpbi5sZWZ0LWF4aXNwb3MueXRpdGxlfSwje21hcmdpbi50b3AraGVpZ2h0LzJ9KVwiKVxuXG5cbiAgICAgICAgbGFiZWxzID0gZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJpZFwiLCBcImxhYmVsc1wiKVxuICAgICAgICBsYWJlbHNTZWxlY3QgPVxuICAgICAgICAgIGxhYmVscy5zZWxlY3RBbGwoXCJlbXB0eVwiKVxuICAgICAgICAgICAgICAgIC5kYXRhKGRhdGEpXG4gICAgICAgICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAgICAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAgICAgICAgIC50ZXh0KChkKS0+IHJldHVybiB3aW5kb3cuYXBwLnNrZXRjaGVzLmdldChkLlBST1BPU0FMKS5hdHRyaWJ1dGVzLm5hbWUpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIChkLGkpIC0+XG4gICAgICAgICAgICAgICAgICB4cG9zID0geHNjYWxlKHhbaV0pXG4gICAgICAgICAgICAgICAgICBzdHJpbmdfZW5kID0geHBvcyt0aGlzLmdldENvbXB1dGVkVGV4dExlbmd0aCgpXG4gICAgICAgICAgICAgICAgICBvdmVybGFwX3hzdGFydCA9IHhwb3MtKHRoaXMuZ2V0Q29tcHV0ZWRUZXh0TGVuZ3RoKCkrNSlcbiAgICAgICAgICAgICAgICAgIGlmIG92ZXJsYXBfeHN0YXJ0IDwgNTBcbiAgICAgICAgICAgICAgICAgICAgb3ZlcmxhcF94c3RhcnQgPSA1MFxuICAgICAgICAgICAgICAgICAgcmV0dXJuIG92ZXJsYXBfeHN0YXJ0IGlmIHN0cmluZ19lbmQgPiB3aWR0aFxuICAgICAgICAgICAgICAgICAgcmV0dXJuIHhwb3MrNVxuICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwieVwiLCAoZCxpKSAtPlxuICAgICAgICAgICAgICAgICAgeXBvcyA9IHlzY2FsZSh5W2ldKVxuICAgICAgICAgICAgICAgICAgcmV0dXJuIHlwb3MrMTAgaWYgKHlwb3MgPCA1MClcbiAgICAgICAgICAgICAgICAgIHJldHVybiB5cG9zLTVcbiAgICAgICAgICAgICAgICAgIClcblxuXG4gICAgICAgIHBvaW50cyA9IGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiaWRcIiwgXCJwb2ludHNcIilcbiAgICAgICAgcG9pbnRzU2VsZWN0ID1cbiAgICAgICAgICBwb2ludHMuc2VsZWN0QWxsKFwiZW1wdHlcIilcbiAgICAgICAgICAgICAgICAuZGF0YShkYXRhKVxuICAgICAgICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgICAgICAgLmFwcGVuZChcImNpcmNsZVwiKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwiY3hcIiwgKGQsaSkgLT4geHNjYWxlKHhbaV0pKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwiY3lcIiwgKGQsaSkgLT4geXNjYWxlKHlbaV0pKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgKGQsaSkgLT4gXCJwdCN7aX1cIilcbiAgICAgICAgICAgICAgICAuYXR0cihcInJcIiwgcG9pbnRzaXplKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwiZmlsbFwiLCAoZCxpKSAtPlxuICAgICAgICAgICAgICAgICAgICAgICAgICB2YWwgPSBpXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbCA9IGdldENvbG9ycyhbdmFsXSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbFxuICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJzdHJva2VcIiwgKGQsIGkpIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZhbCA9IE1hdGguZmxvb3IoaS8xNykgJSA1XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbCA9IGdldFN0cm9rZUNvbG9yKHZhbClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbFxuICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgXCIxXCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJvcGFjaXR5XCIsIChkLGkpIC0+XG4gICAgICAgICAgICAgICAgICAgICByZXR1cm4gMSBpZiAoeFtpXT8gb3IgeE5BLmhhbmRsZSkgYW5kICh5W2ldPyBvciB5TkEuaGFuZGxlKVxuICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDApXG5cbiAgICAgICAgIyBib3hcbiAgICAgICAgZy5hcHBlbmQoXCJyZWN0XCIpXG4gICAgICAgICAgICAgICAuYXR0cihcInhcIiwgbWFyZ2luLmxlZnQrcGFuZWxvZmZzZXQpXG4gICAgICAgICAgICAgICAuYXR0cihcInlcIiwgbWFyZ2luLnRvcClcbiAgICAgICAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIHBhbmVsaGVpZ2h0KVxuICAgICAgICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCBwYW5lbHdpZHRoKVxuICAgICAgICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIFwibm9uZVwiKVxuICAgICAgICAgICAgICAgLmF0dHIoXCJzdHJva2VcIiwgXCJibGFja1wiKVxuICAgICAgICAgICAgICAgLmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgXCJub25lXCIpXG5cblxuXG4gICAgIyMgY29uZmlndXJhdGlvbiBwYXJhbWV0ZXJzXG5cblxuICAgIGNoYXJ0LndpZHRoID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHdpZHRoIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICB3aWR0aCA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQuaGVpZ2h0ID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIGhlaWdodCBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgaGVpZ2h0ID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC5tYXJnaW4gPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4gbWFyZ2luIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICBtYXJnaW4gPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0LmF4aXNwb3MgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4gYXhpc3BvcyBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgYXhpc3BvcyA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQueGxpbSA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiB4bGltIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICB4bGltID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC5ueHRpY2tzID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIG54dGlja3MgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIG54dGlja3MgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0Lnh0aWNrcyA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiB4dGlja3MgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHh0aWNrcyA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQueWxpbSA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiB5bGltIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICB5bGltID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC5ueXRpY2tzID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIG55dGlja3MgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIG55dGlja3MgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0Lnl0aWNrcyA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiB5dGlja3MgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHl0aWNrcyA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQucmVjdGNvbG9yID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHJlY3Rjb2xvciBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgcmVjdGNvbG9yID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC5wb2ludGNvbG9yID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHBvaW50Y29sb3IgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHBvaW50Y29sb3IgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0LnBvaW50c2l6ZSA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiBwb2ludHNpemUgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHBvaW50c2l6ZSA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQucG9pbnRzdHJva2UgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4gcG9pbnRzdHJva2UgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHBvaW50c3Ryb2tlID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC54bGFiID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHhsYWIgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHhsYWIgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0LnlsYWIgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4geWxhYiBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgeWxhYiA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQueHZhciA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiB4dmFyIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICB4dmFyID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC55dmFyID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHl2YXIgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHl2YXIgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0LnlzY2FsZSA9ICgpIC0+XG4gICAgICByZXR1cm4geXNjYWxlXG5cbiAgICBjaGFydC54c2NhbGUgPSAoKSAtPlxuICAgICAgcmV0dXJuIHhzY2FsZVxuXG4gICAgY2hhcnQucG9pbnRzU2VsZWN0ID0gKCkgLT5cbiAgICAgIHJldHVybiBwb2ludHNTZWxlY3RcblxuICAgIGNoYXJ0LmxhYmVsc1NlbGVjdCA9ICgpIC0+XG4gICAgICByZXR1cm4gbGFiZWxzU2VsZWN0XG5cbiAgICBjaGFydC5sZWdlbmRTZWxlY3QgPSAoKSAtPlxuICAgICAgcmV0dXJuIGxlZ2VuZFNlbGVjdFxuXG4gICAgIyByZXR1cm4gdGhlIGNoYXJ0IGZ1bmN0aW9uXG4gICAgY2hhcnRcblxuICBnZXRDb2xvcnMgPSAoaSkgLT5cbiAgICBjb2xvcnMgPSBbXCJMaWdodEdyZWVuXCIsIFwiTGlnaHRQaW5rXCIsIFwiTGlnaHRTa3lCbHVlXCIsIFwiTW9jY2FzaW5cIiwgXCJCbHVlVmlvbGV0XCIsIFwiR2FpbnNib3JvXCIsIFwiRGFya0dyZWVuXCIsIFwiRGFya1R1cnF1b2lzZVwiLCBcIm1hcm9vblwiLCBcIm5hdnlcIiwgXCJMZW1vbkNoaWZmb25cIiwgXCJvcmFuZ2VcIiwgIFwicmVkXCIsIFwic2lsdmVyXCIsIFwidGVhbFwiLCBcIndoaXRlXCIsIFwiYmxhY2tcIl1cbiAgICByZXR1cm4gY29sb3JzW2ldXG5cbiAgZ2V0U3Ryb2tlQ29sb3IgPSAoaSkgLT5cbiAgICBzY29sb3JzID0gW1wiYmxhY2tcIiwgXCJ3aGl0ZVwiLCBcImdyYXlcIiwgXCJicm93blwiLCBcIk5hdnlcIl1cbiAgICByZXR1cm4gc2NvbG9yc1tpXVxuXG4gICMgZnVuY3Rpb24gdG8gZGV0ZXJtaW5lIHJvdW5kaW5nIG9mIGF4aXMgbGFiZWxzXG4gIGZvcm1hdEF4aXMgPSAoZCkgLT5cbiAgICBkID0gZFsxXSAtIGRbMF1cbiAgICBuZGlnID0gTWF0aC5mbG9vciggTWF0aC5sb2coZCAlIDEwKSAvIE1hdGgubG9nKDEwKSApXG4gICAgbmRpZyA9IDAgaWYgbmRpZyA+IDBcbiAgICBuZGlnID0gTWF0aC5hYnMobmRpZylcbiAgICBkMy5mb3JtYXQoXCIuI3tuZGlnfWZcIilcblxubW9kdWxlLmV4cG9ydHMgPSBBcnJheVRyYWRlb2Zmc1RhYlxuIiwibW9kdWxlLmV4cG9ydHMgPSBcbiAgU0FOQ1RVQVJZX0lEOiAnNTMzZGU5NmJhNDk4ODY3YzU2YzZkMWM1J1xuICBBUVVBQ1VMVFVSRV9JRDogJzUyMGJiMWMwMGJkMjJjOWIyMTQ3Yjk5YidcbiAgTU9PUklOR19JRDogJzUzM2RlNGUzYTQ5ODg2N2M1NmM2Y2Q0NSdcbiAgTk9fTkVUX1pPTkVTX0lEOiAnNTMzZGU2MjBhNDk4ODY3YzU2YzZjZmMyJ1xuICBTSElQUElOR19aT05FX0lEOiAnNTMzZGVjYTdhNDk4ODY3YzU2YzZkNTVmJ1xuIiwidGVtcGxhdGVzID0gcmVxdWlyZSAnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcbkFycmF5T3ZlcnZpZXdUYWIgPSByZXF1aXJlICcuL2FycmF5T3ZlcnZpZXdUYWIuY29mZmVlJ1xuQXJyYXlIYWJpdGF0VGFiID0gcmVxdWlyZSAnLi9hcnJheUhhYml0YXRUYWIuY29mZmVlJ1xuQXJyYXlGaXNoaW5nVmFsdWVUYWIgPSByZXF1aXJlICcuL2FycmF5RmlzaGluZ1ZhbHVlVGFiLmNvZmZlZSdcbkFycmF5VHJhZGVvZmZzVGFiID0gcmVxdWlyZSAnLi9hcnJheVRyYWRlb2Zmcy5jb2ZmZWUnXG4jT3ZlcnZpZXdUYWIgPSByZXF1aXJlICcuL292ZXJ2aWV3VGFiLmNvZmZlZSdcbndpbmRvdy5hcHAucmVnaXN0ZXJSZXBvcnQgKHJlcG9ydCkgLT5cbiAgcmVwb3J0LnRhYnMgW0FycmF5T3ZlcnZpZXdUYWIsIEFycmF5SGFiaXRhdFRhYiwgQXJyYXlGaXNoaW5nVmFsdWVUYWIsIEFycmF5VHJhZGVvZmZzVGFiXVxuICAjcmVwb3J0LnRhYnMgW092ZXJ2aWV3VGFiXVxuICAjIHBhdGggbXVzdCBiZSByZWxhdGl2ZSB0byBkaXN0L1xuICByZXBvcnQuc3R5bGVzaGVldHMgWycuL3Byb3Bvc2FsLmNzcyddXG5cbiAgIiwidGhpc1tcIlRlbXBsYXRlc1wiXSA9IHRoaXNbXCJUZW1wbGF0ZXNcIl0gfHwge307XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiYXF1YWN1bHR1cmVGaXNoaW5nVmFsdWVcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RmlzaGluZyBWYWx1ZTwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGlzIGFxdWFjdWx0dXJlIGFyZWEgZGlzcGxhY2VzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwicGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIG9mIHRoZSBmaXNoaW5nIHZhbHVlIHdpdGhpbiBCYXJidWRh4oCZcyB3YXRlcnMsIGJhc2VkIG9uIHVzZXIgcmVwb3J0ZWRcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgdmFsdWVzIG9mIGZpc2hpbmcgZ3JvdW5kcy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjUzM2YxNmY2YTQ5ODg2N2M1NmM2ZmI1N1xcXCI+c2hvdyBmaXNoaW5nIHZhbHVlcyBsYXllcjwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcImFycmF5RmlzaGluZ1ZhbHVlXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkRpc3BsYWNlZCBGaXNoaW5nIFZhbHVlPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaGFzU2FuY3R1YXJpZXNcIixjLHAsMSksYyxwLDAsODYsNDYxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgVGhpcyBwcm9wb3NhbCBpbmNsdWRlcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm51bVNhbmN0dWFyaWVzXCIsYyxwLDApKSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICBcIik7aWYoXy5zKF8uZihcInNhbmNQbHVyYWxcIixjLHAsMSksYyxwLDAsMjAyLDIxMyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiU2FuY3R1YXJpZXNcIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJzYW5jUGx1cmFsXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiU2FuY3R1YXJ5XCIpO307Xy5iKFwiPC9zdHJvbmc+LFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIGRpc3BsYWNpbmcgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJzYW5jdHVhcnlQZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiBmaXNoaW5nIHZhbHVlIHdpdGhpbiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICBCYXJidWRhJ3Mgd2F0ZXJzIGJhc2VkIG9uIHVzZXIgcmVwb3J0ZWQgdmFsdWVzIG9mIGZpc2hpbmcgZ3JvdW5kcy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKF8ucyhfLmYoXCJoYXNOb05ldFpvbmVzXCIsYyxwLDEpLGMscCwwLDUwMyw5MDUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICBUaGlzIHByb3Bvc2FsIGluY2x1ZGVzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibnVtTm9OZXRab25lc1wiLGMscCwwKSkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgXCIpO2lmKF8ucyhfLmYoXCJub05ldFpvbmVzUGx1cmFsXCIsYyxwLDEpLGMscCwwLDYyNCw2MzYsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIk5vLU5ldCBab25lc1wiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcIm5vTmV0Wm9uZXNQbHVyYWxcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJOby1OZXQgWm9uZVwiKTt9O18uYihcIjwvc3Ryb25nPixcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICBkaXNwbGFjaW5nIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibm9OZXRab25lc1BlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIGZpc2hpbmcgdmFsdWUgd2l0aGluIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIEJhcmJ1ZGEncyB3YXRlcnMgYmFzZWQgb24gdXNlciByZXBvcnRlZCB2YWx1ZXMgb2YgZmlzaGluZyBncm91bmRzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoXy5zKF8uZihcImhhc01vb3JpbmdzXCIsYyxwLDEpLGMscCwwLDk0NCwxMzIwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgVGhpcyBwcm9wb3NhbCBpbmNsdWRlcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm51bU1vb3JpbmdzXCIsYyxwLDApKSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICBNb29yaW5nIGFuZCBBbmNob3JhZ2UgWm9uZVwiKTtpZihfLnMoXy5mKFwibW9vcmluZ3NQbHVyYWxcIixjLHAsMSksYyxwLDAsMTA4NywxMDg4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzXCIpO30pO2MucG9wKCk7fV8uYihcIjwvc3Ryb25nPixcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICB3aGljaCBtYXkgcG90ZW50aWFsbHkgZGlzcGxhY2UgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJtb29yaW5nc1BlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIGZpc2hpbmcgdmFsdWUgd2l0aGluIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIEJhcmJ1ZGEncyB3YXRlcnMgYmFzZWQgb24gdXNlciByZXBvcnRlZCB2YWx1ZXMgb2YgZmlzaGluZyBncm91bmRzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoXy5zKF8uZihcImhhc1NoaXBwaW5nWm9uZXNcIixjLHAsMSksYyxwLDAsMTM2MiwxNzQ1LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgVGhpcyBwcm9wb3NhbCBpbmNsdWRlcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm51bVNoaXBwaW5nWm9uZXNcIixjLHAsMCkpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIFNoaXBwaW5nIFpvbmVcIik7aWYoXy5zKF8uZihcInNoaXBwaW5nWm9uZXNQbHVyYWxcIixjLHAsMSksYyxwLDAsMTUwMiwxNTAzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzXCIpO30pO2MucG9wKCk7fV8uYihcIjwvc3Ryb25nPixcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICB3aGljaCBtYXkgcG90ZW50aWFsbHkgZGlzcGxhY2UgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJzaGlwcGluZ1pvbmVzUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgZmlzaGluZyB2YWx1ZSB3aXRoaW4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgQmFyYnVkYSdzIHdhdGVycyBiYXNlZCBvbiB1c2VyIHJlcG9ydGVkIHZhbHVlcyBvZiBmaXNoaW5nIGdyb3VuZHMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3A+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjUzM2YxNmY2YTQ5ODg2N2M1NmM2ZmI1N1xcXCI+c2hvdyBmaXNoaW5nIHZhbHVlcyBsYXllcjwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcImFycmF5SGFiaXRhdHNcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7aWYoXy5zKF8uZihcInNhbmN0dWFyaWVzXCIsYyxwLDEpLGMscCwwLDE2LDkxOSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+SGFiaXRhdHMgd2l0aGluIFwiKTtfLmIoXy52KF8uZihcIm51bVNhbmN0dWFyaWVzXCIsYyxwLDApKSk7Xy5iKFwiIFwiKTtpZighXy5zKF8uZihcInNhbmN0dWFyeVBsdXJhbFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIlNhbmN0dWFyeVwiKTt9O2lmKF8ucyhfLmYoXCJzYW5jdHVhcnlQbHVyYWxcIixjLHAsMSksYyxwLDAsMTcwLDE4MSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiU2FuY3R1YXJpZXNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5IYWJpdGF0PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5QZXJjZW50IG9mIFRvdGFsIEhhYml0YXQ8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPk1lZXRzIDMzJSBnb2FsPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcInNhbmN0dWFyeUhhYml0YXRcIixjLHAsMSksYyxwLDAsNDAzLDYxNixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyIGNsYXNzPVxcXCJcIik7aWYoXy5zKF8uZihcIm1lZXRzR29hbFwiLGMscCwxKSxjLHAsMCw0MzUsNDQyLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJtZXRHb2FsXCIpO30pO2MucG9wKCk7fV8uYihcIlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiSGFiVHlwZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiAlPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7aWYoXy5zKF8uZihcIm1lZXRzR29hbFwiLGMscCwxKSxjLHAsMCw1NDUsNTQ4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJ5ZXNcIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJtZWV0c0dvYWxcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJub1wiKTt9O18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBQZXJjZW50YWdlcyBzaG93biByZXByZXNlbnQgdGhlIHByb3BvcnRpb24gb2YgaGFiaXRhdHMgYXZhaWxhYmxlIGluIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBCYXJidWRhJ3MgZW50aXJlIDMgbmF1dGljYWwgbWlsZSBib3VuZGFyeSBjYXB0dXJlZCB3aXRoaW4gc2FuY3R1YXJpZXMuIDxicj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTMzZGRmODZhNDk4ODY3YzU2YzZjODMwXFxcIj5zaG93IGhhYml0YXRzIGxheWVyPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwibW9vcmluZ3NcIixjLHAsMSksYyxwLDAsOTUwLDE1NjEsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkhhYml0YXRzIHdpdGhpbiBcIik7Xy5iKF8udihfLmYoXCJudW1Nb29yaW5nc1wiLGMscCwwKSkpO18uYihcIiBNb29yaW5nIEFyZWFcIik7aWYoXy5zKF8uZihcIm1vb3JpbmdQbHVyYWxcIixjLHAsMSksYyxwLDAsMTA2MiwxMDYzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzXCIpO30pO2MucG9wKCk7fV8uYihcIjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+SGFiaXRhdDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+UGVyY2VudCBvZiBUb3RhbCBIYWJpdGF0PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcIm1vb3JpbmdEYXRhXCIsYyxwLDEpLGMscCwwLDEyNDYsMTMzNixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkhhYlR5cGVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIgJTwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8IS0tICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFBlcmNlbnRhZ2VzIHNob3duIHJlcHJlc2VudCB0aGUgcHJvcG9ydGlvbiBvZiBoYWJpdGF0cyBhdmFpbGFibGUgaW4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIEJhcmJ1ZGEncyBlbnRpcmUgMyBuYXV0aWNhbCBtaWxlIGJvdW5kYXJ5IGNhcHR1cmVkIHdpdGhpbiBtb29yaW5nIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBhcmVhcy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD4gLS0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJoYXNOb05ldFpvbmVzXCIsYyxwLDEpLGMscCwwLDE1OTQsMjIxMixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+SGFiaXRhdHMgd2l0aGluIFwiKTtfLmIoXy52KF8uZihcIm51bU5vTmV0Wm9uZXNcIixjLHAsMCkpKTtfLmIoXCIgTm8gTmV0IFpvbmVcIik7aWYoXy5zKF8uZihcIm5vTmV0Wm9uZXNQbHVyYWxcIixjLHAsMSksYyxwLDAsMTcxMCwxNzExLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzXCIpO30pO2MucG9wKCk7fV8uYihcIjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+SGFiaXRhdDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+UGVyY2VudCBvZiBUb3RhbCBIYWJpdGF0PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcIm5vTmV0Wm9uZXNEYXRhXCIsYyxwLDEpLGMscCwwLDE5MDAsMTk5MCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkhhYlR5cGVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIgJTwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwhLS0gPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFBlcmNlbnRhZ2VzIHNob3duIHJlcHJlc2VudCB0aGUgcHJvcG9ydGlvbiBvZiBoYWJpdGF0cyBhdmFpbGFibGUgaW4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIEJhcmJ1ZGEncyBlbnRpcmUgMyBuYXV0aWNhbCBtaWxlIGJvdW5kYXJ5IGNhcHR1cmVkIHdpdGhpbiBubyBuZXQgem9uZXMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+IC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+TWFyeGFuIEFuYWx5c2lzIDxhIHN0eWxlPVxcXCJ0b3A6MHB4O1xcXCIgY2xhc3M9XFxcIm1hcnhhbi1ub2RlXFxcIiBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MzNkZTIwYWE0OTg4NjdjNTZjNmNiYTVcXFwiPlNob3cgJ1NjZW5hcmlvIDEnIE1hcnhhbiBMYXllcjwvYT4mbmJzcDwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8c2VsZWN0IGNsYXNzPVxcXCJjaG9zZW5cXFwiIHdpZHRoPVxcXCI0MDBweFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcIm1hcnhhbkFuYWx5c2VzXCIsYyxwLDEpLGMscCwwLDI0ODIsMjUzNyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIDxvcHRpb24gdmFsdWU9XFxcIlwiKTtfLmIoXy52KF8uZChcIi5cIixjLHAsMCkpKTtfLmIoXCJcXFwiPlNjZW5hcmlvIFwiKTtfLmIoXy52KF8uZChcIi5cIixjLHAsMCkpKTtfLmIoXCI8L29wdGlvbj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgPC9zZWxlY3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwic2NlbmFyaW9SZXN1bHRzXFxcIj48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJ2aXpcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcInNjZW5hcmlvRGVzY3JpcHRpb25cXFwiPjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiYXJyYXlPdmVydmlld1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtpZihfLnMoXy5kKFwic2tldGNoQ2xhc3MuZGVsZXRlZFwiLGMscCwxKSxjLHAsMCwyNCwyNzAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcImFsZXJ0IGFsZXJ0LXdhcm5cXFwiIHN0eWxlPVxcXCJtYXJnaW4tYm90dG9tOjEwcHg7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFRoaXMgc2tldGNoIHdhcyBjcmVhdGVkIHVzaW5nIHRoZSBcXFwiXCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIlxcXCIgdGVtcGxhdGUsIHdoaWNoIGlzXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBubyBsb25nZXIgYXZhaWxhYmxlLiBZb3Ugd2lsbCBub3QgYmUgYWJsZSB0byBjb3B5IHRoaXMgc2tldGNoIG9yIG1ha2UgbmV3XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBza2V0Y2hlcyBvZiB0aGlzIHR5cGUuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gc2l6ZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+U2l6ZTwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhhc1NrZXRjaGVzXCIsYyxwLDEpLGMscCwwLDM2Myw4NzQsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGlzIGNvbGxlY3Rpb24gaXMgY29tcG9zZWQgb2YgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJudW1Ta2V0Y2hlc1wiLGMscCwwKSkpO18uYihcIiB6b25lXCIpO2lmKF8ucyhfLmYoXCJza2V0Y2hlc1BsdXJhbFwiLGMscCwxKSxjLHAsMCw0NjgsNDY5LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzXCIpO30pO2MucG9wKCk7fV8uYihcIjwvc3Ryb25nPiBpbiBib3RoIG9jZWFuIGFuZCBsYWdvb24gd2F0ZXJzLiBUaGUgY29sbGVjdGlvbiBpbmNsdWRlcyBhIHRvdGFsIDxlbT5vY2VhbmljPC9lbT4gYXJlYSBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInN1bU9jZWFuQXJlYVwiLGMscCwwKSkpO18uYihcIiBzcXVhcmUgbWlsZXM8L3N0cm9uZz4sIHdoaWNoIHJlcHJlc2VudHMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJzdW1PY2VhblBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIEJhcmJ1ZGEncyB3YXRlcnMuIEl0IGFsc28gaW5jb3Jwb3JhdGVzIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInN1bUxhZ29vbkFyZWFcIixjLHAsMCkpKTtfLmIoXCIgc3F1YXJlIG1pbGVzPC9zdHJvbmc+LCBvciA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInN1bUxhZ29vblBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+LCBvZiB0aGUgdG90YWwgPGVtPmxhZ29vbiBhcmVhPC9lbT4uXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZihfLnMoXy5mKFwiaGFzU2FuY3R1YXJpZXNcIixjLHAsMSksYyxwLDAsOTE0LDE2NTMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGUgY29sbGVjdGlvbiBpbmNsdWRlcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm51bVNhbmN0dWFyaWVzXCIsYyxwLDApKSk7Xy5iKFwiIFwiKTtpZighXy5zKF8uZihcInNhbmN0dWFyaWVzUGx1cmFsXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwic2FuY3R1YXJ5XCIpO307aWYoXy5zKF8uZihcInNhbmN0dWFyaWVzUGx1cmFsXCIsYyxwLDEpLGMscCwwLDEwNjcsMTA3OCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic2FuY3R1YXJpZXNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9zdHJvbmc+IGluIGJvdGggb2NlYW4gYW5kIGxhZ29vbiB3YXRlcnMuIFRoZSBcIik7aWYoIV8ucyhfLmYoXCJzYW5jdHVhcmllc1BsdXJhbFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcInNhbmN0dWFyeVwiKTt9O2lmKF8ucyhfLmYoXCJzYW5jdHVhcmllc1BsdXJhbFwiLGMscCwxKSxjLHAsMCwxMjIyLDEyMzMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInNhbmN0dWFyaWVzXCIpO30pO2MucG9wKCk7fV8uYihcIiBjb250YWluXCIpO2lmKCFfLnMoXy5mKFwic2FuY3R1YXJpZXNQbHVyYWxcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJzXCIpO307Xy5iKFwiIGEgdG90YWwgPGVtPm9jZWFuaWM8L2VtPiBhcmVhIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwic2FuY3R1YXJ5T2NlYW5BcmVhXCIsYyxwLDApKSk7Xy5iKFwiIHNxdWFyZSBtaWxlczwvc3Ryb25nPiwgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIHdoaWNoIHJlcHJlc2VudHMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJzYW5jdHVhcnlPY2VhblBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIEJhcmJ1ZGEncyB3YXRlcnMuIEl0IGFsc28gaW5jbHVkZXMgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwic2FuY3R1YXJ5TGFnb29uQXJlYVwiLGMscCwwKSkpO18uYihcIiBzcXVhcmUgbWlsZXM8L3N0cm9uZz4sIG9yIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwic2FuY3R1YXJ5TGFnb29uUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4sIG9mIHRoZSB0b3RhbCA8ZW0+bGFnb29uIGFyZWE8L2VtPi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKF8ucyhfLmYoXCJoYXNOb05ldFpvbmVzXCIsYyxwLDEpLGMscCwwLDE2OTMsMjMyOSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoZSBjb2xsZWN0aW9uIGluY2x1ZGVzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibnVtTm9OZXRab25lc1wiLGMscCwwKSkpO18uYihcIiBObyBOZXQgWm9uZVwiKTtpZihfLnMoXy5mKFwibm9OZXRab25lc1BsdXJhbFwiLGMscCwxKSxjLHAsMCwxODAyLDE4MDMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9zdHJvbmc+IGluIGJvdGggb2NlYW4gYW5kIGxhZ29vbiB3YXRlcnMuIFRoZSBObyBOZXQgWm9uZVwiKTtpZihfLnMoXy5mKFwibm9OZXRab25lc1BsdXJhbFwiLGMscCwxKSxjLHAsMCwxOTAzLDE5MDQsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9zdHJvbmc+IGNvbnRhaW5cIik7aWYoIV8ucyhfLmYoXCJub05ldFpvbmVzUGx1cmFsXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwic1wiKTt9O18uYihcIiBhIHRvdGFsIDxlbT5vY2VhbmljPC9lbT4gYXJlYSBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm5vTmV0Wm9uZXNPY2VhbkFyZWFcIixjLHAsMCkpKTtfLmIoXCIgc3F1YXJlIG1pbGVzPC9zdHJvbmc+LCB3aGljaCByZXByZXNlbnRzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibm9OZXRab25lc09jZWFuUGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgQmFyYnVkYSdzIHdhdGVycy4gSXQgYWxzbyBpbmNsdWRlcyBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJub05ldFpvbmVzTGFnb29uQXJlYVwiLGMscCwwKSkpO18uYihcIiBzcXVhcmUgbWlsZXM8L3N0cm9uZz4sIG9yIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibm9OZXRab25lc0xhZ29vblBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+LCBvZiB0aGUgdG90YWwgPGVtPmxhZ29vbiBhcmVhPC9lbT4uXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZihfLnMoXy5mKFwiaGFzTW9vcmluZ3NcIixjLHAsMSksYyxwLDAsMjM2NiwyOTc4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhlIGNvbGxlY3Rpb24gaW5jbHVkZXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJudW1Nb29yaW5nc1wiLGMscCwwKSkpO18uYihcIiBNb29yaW5nIEFyZWFcIik7aWYoXy5zKF8uZihcIm1vb3JpbmdzUGx1cmFsXCIsYyxwLDEpLGMscCwwLDI0NzIsMjQ3MyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic1wiKTt9KTtjLnBvcCgpO31fLmIoXCI8L3N0cm9uZz4gaW4gYm90aCBvY2VhbiBhbmQgbGFnb29uIHdhdGVycy4gVGhlIE1vb3JpbmcgQXJlYVwiKTtpZihfLnMoXy5mKFwibW9vcmluZ3NQbHVyYWxcIixjLHAsMSksYyxwLDAsMjU3MCwyNTcxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzXCIpO30pO2MucG9wKCk7fV8uYihcIiBjb250YWluXCIpO2lmKCFfLnMoXy5mKFwibW9vcmluZ3NQbHVyYWxcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJzXCIpO307Xy5iKFwiIGEgdG90YWwgPGVtPm9jZWFuaWM8L2VtPiBhcmVhIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibW9vcmluZ3NPY2VhbkFyZWFcIixjLHAsMCkpKTtfLmIoXCIgc3F1YXJlIG1pbGVzPC9zdHJvbmc+LCBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgd2hpY2ggcmVwcmVzZW50cyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm1vb3JpbmdzT2NlYW5QZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiBCYXJidWRhJ3Mgd2F0ZXJzLiBJdCBhbHNvIGluY2x1ZGVzIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm1vb3JpbmdzTGFnb29uQXJlYVwiLGMscCwwKSkpO18uYihcIiBzcXVhcmUgbWlsZXM8L3N0cm9uZz4sIG9yIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibW9vcmluZ3NMYWdvb25QZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiwgb2YgdGhlIHRvdGFsIDxlbT5sYWdvb24gYXJlYTwvZW0+LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoXy5zKF8uZihcImhhc0FxdWFjdWx0dXJlXCIsYyxwLDEpLGMscCwwLDMwMTYsMzY2NCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoZSBjb2xsZWN0aW9uIGluY2x1ZGVzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibnVtQXF1YWN1bHR1cmVcIixjLHAsMCkpKTtfLmIoXCIgQXF1YWN1bHR1cmUgQXJlYVwiKTtpZihfLnMoXy5mKFwiYXF1YWN1bHR1cmVQbHVyYWxcIixjLHAsMSksYyxwLDAsMzEzMiwzMTMzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzXCIpO30pO2MucG9wKCk7fV8uYihcIjwvc3Ryb25nPiBpbiBib3RoIG9jZWFuIGFuZCBsYWdvb24gd2F0ZXJzLiBUaGUgQXF1YWN1bHR1cmUgQXJlYVwiKTtpZihfLnMoXy5mKFwiYXF1YWN1bHR1cmVQbHVyYWxcIixjLHAsMSksYyxwLDAsMzI0MCwzMjQxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJzXCIpO30pO2MucG9wKCk7fV8uYihcIiBjb250YWluXCIpO2lmKCFfLnMoXy5mKFwiYXF1YWN1bHR1cmVQbHVyYWxcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJzXCIpO307Xy5iKFwiIGEgdG90YWwgPGVtPm9jZWFuaWM8L2VtPiBhcmVhIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiYXF1YWN1bHR1cmVPY2VhbkFyZWFcIixjLHAsMCkpKTtfLmIoXCIgc3F1YXJlIG1pbGVzPC9zdHJvbmc+LCB3aGljaCByZXByZXNlbnRzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiYXF1YWN1bHR1cmVPY2VhblBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIEJhcmJ1ZGEncyB3YXRlcnMuIEl0IGFsc28gaW5jbHVkZXMgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiYXF1YWN1bHR1cmVMYWdvb25BcmVhXCIsYyxwLDApKSk7Xy5iKFwiIHNxdWFyZSBtaWxlczwvc3Ryb25nPiwgb3IgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJhcXVhY3VsdHVyZUxhZ29vblBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+LCBvZiB0aGUgdG90YWwgPGVtPmxhZ29vbiBhcmVhPC9lbT4uXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZihfLnMoXy5mKFwiaGFzRmlzaGluZ0FyZWFzXCIsYyxwLDEpLGMscCwwLDM3MDYsNDM3NSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoZSBjb2xsZWN0aW9uIGluY2x1ZGVzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibnVtRmlzaGluZ0FyZWFzXCIsYyxwLDApKSk7Xy5iKFwiIEZpc2hpbmcgUHJpb3JpdHkgQXJlYVwiKTtpZihfLnMoXy5mKFwiZmlzaGluZ0FyZWFzUGx1cmFsXCIsYyxwLDEpLGMscCwwLDM4MjksMzgzMCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic1wiKTt9KTtjLnBvcCgpO31fLmIoXCI8L3N0cm9uZz4gaW4gYm90aCBvY2VhbiBhbmQgbGFnb29uIHdhdGVycy4gVGhlIEZpc2hpbmcgUHJpb3JpdHkgQXJlYVwiKTtpZihfLnMoXy5mKFwiZmlzaGluZ0FyZWFzUGx1cmFsXCIsYyxwLDEpLGMscCwwLDM5NDQsMzk0NSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwic1wiKTt9KTtjLnBvcCgpO31fLmIoXCIgY29udGFpblwiKTtpZighXy5zKF8uZihcImZpc2hpbmdBcmVhc1BsdXJhbFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcInNcIik7fTtfLmIoXCIgYSB0b3RhbCA8ZW0+b2NlYW5pYzwvZW0+IGFyZWEgb2YgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJmaXNoaW5nQXJlYXNPY2VhbkFyZWFcIixjLHAsMCkpKTtfLmIoXCIgc3F1YXJlIG1pbGVzPC9zdHJvbmc+LCB3aGljaCByZXByZXNlbnRzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiZmlzaGluZ0FyZWFzT2NlYW5QZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiBCYXJidWRhJ3Mgd2F0ZXJzLiBJdCBhbHNvIGluY2x1ZGVzIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImZpc2hpbmdBcmVhc0xhZ29vbkFyZWFcIixjLHAsMCkpKTtfLmIoXCIgc3F1YXJlIG1pbGVzPC9zdHJvbmc+LCBvciA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImZpc2hpbmdBcmVhc0xhZ29vblBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+LCBvZiB0aGUgdG90YWwgPGVtPmxhZ29vbiBhcmVhPC9lbT4uXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8IS0tXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+Wm9uZXMgaW4gdGhpcyBQcm9wb3NhbDwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJ0b2NDb250YWluZXJcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIi0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJhbnlBdHRyaWJ1dGVzXCIsYyxwLDEpLGMscCwwLDQ1MzQsNDY1OCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+XCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIiBBdHRyaWJ1dGVzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXy5ycChcImF0dHJpYnV0ZXMvYXR0cmlidXRlc1RhYmxlXCIsYyxwLFwiICBcIikpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fXJldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcImFycmF5VHJhZGVvZmZzXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlRyYWRlb2ZmczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdDxwIGNsYXNzPVxcXCJsYXJnZVxcXCIgc3R5bGU9XFxcIm1hcmdpbi1sZWZ0OjE1cHg7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0XHQ8YSBocmVmID0gXFxcImh0dHA6Ly9tY2NsaW50b2NrLm1zaS51Y3NiLmVkdS9ibG9nL3RyYWRlb2ZmLWFuYWx5c2VzLWluLXNlYXNrZXRjaFxcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPlRyYWRlb2ZmIEFuYWx5c2lzPC9hPiBleGFtaW5lcyB0aGUgaW1wYWN0IG9mIGxvYnN0ZXIgYW5kIGNvbmNoIGZpc2hpbmcgb24gcmVsYXRpdmUgZWNvbG9naWNhbCBhbmQgZmlzaGluZyB2YWx1ZXMuIFByZXZlbnRpbmcgZmlzaGluZyBpbiBhbiBhcmVhIGdlbmVyYWxseVwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgXHRcdGluY3JlYXNlcyB0aGUgZWNvbG9naWNhbCBzY29yZSBieSByZWR1Y2luZyBpbXBhY3RzIGFuZCBkZWNyZWFzZXMgZmlzaGluZyB2YWx1ZXMgYnkgcmVkdWNpbmcgZmlzaGluZyB0YWtlLiBTdG9wcGluZyBmaXNoaW5nIGluIHNvbWUgYXJlYXMsIHN1Y2ggYXMgbnVyc2VyeSBncm91bmRzLCBjYW5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0XHRpbmNyZWFzZSBib3RoIHNjb3JlcyBieSByZWR1Y2luZyBlY29sb2dpY2FsIGltcGFjdHMgYW5kIGluY3JlYXNpbmcgZmlzaCBzdG9ja3MuIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgXHQ8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQ8cCBjbGFzcz1cXFwic21hbGwgdHRpcC10aXBcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgVGlwOiBob3ZlciBvdmVyIGEgcHJvcG9zYWwgdG8gc2VlIGRldGFpbHNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0PGRpdiAgaWQ9XFxcInRyYWRlb2ZmLWNoYXJ0XFxcIiBjbGFzcz1cXFwidHJhZGVvZmYtY2hhcnRcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJkZW1vXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlJlcG9ydCBTZWN0aW9uczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5Vc2UgcmVwb3J0IHNlY3Rpb25zIHRvIGdyb3VwIGluZm9ybWF0aW9uIGludG8gbWVhbmluZ2Z1bCBjYXRlZ29yaWVzPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RDMgVmlzdWFsaXphdGlvbnM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHVsIGNsYXNzPVxcXCJuYXYgbmF2LXBpbGxzXFxcIiBpZD1cXFwidGFiczJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8bGkgY2xhc3M9XFxcImFjdGl2ZVxcXCI+PGEgaHJlZj1cXFwiI2NoYXJ0XFxcIj5DaGFydDwvYT48L2xpPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8bGk+PGEgaHJlZj1cXFwiI2RhdGFUYWJsZVxcXCI+VGFibGU8L2E+PC9saT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdWw+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJ0YWItY29udGVudFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcInRhYi1wYW5lIGFjdGl2ZVxcXCIgaWQ9XFxcImNoYXJ0XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8IS0tW2lmIElFIDhdPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxwIGNsYXNzPVxcXCJ1bnN1cHBvcnRlZFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgVGhpcyB2aXN1YWxpemF0aW9uIGlzIG5vdCBjb21wYXRpYmxlIHdpdGggSW50ZXJuZXQgRXhwbG9yZXIgOC4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgUGxlYXNlIHVwZ3JhZGUgeW91ciBicm93c2VyLCBvciB2aWV3IHJlc3VsdHMgaW4gdGhlIHRhYmxlIHRhYi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3A+ICAgICAgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPCFbZW5kaWZdLS0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBTZWUgPGNvZGU+c3JjL3NjcmlwdHMvZGVtby5jb2ZmZWU8L2NvZGU+IGZvciBhbiBleGFtcGxlIG9mIGhvdyB0byBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIHVzZSBkMy5qcyB0byByZW5kZXIgdmlzdWFsaXphdGlvbnMuIFByb3ZpZGUgYSB0YWJsZS1iYXNlZCB2aWV3XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBhbmQgdXNlIGNvbmRpdGlvbmFsIGNvbW1lbnRzIHRvIHByb3ZpZGUgYSBmYWxsYmFjayBmb3IgSUU4IHVzZXJzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPGJyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPGEgaHJlZj1cXFwiaHR0cDovL3R3aXR0ZXIuZ2l0aHViLmlvL2Jvb3RzdHJhcC8yLjMuMi9cXFwiPkJvb3RzdHJhcCAyLng8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBpcyBsb2FkZWQgd2l0aGluIFNlYVNrZXRjaCBzbyB5b3UgY2FuIHVzZSBpdCB0byBjcmVhdGUgdGFicyBhbmQgb3RoZXIgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBpbnRlcmZhY2UgY29tcG9uZW50cy4galF1ZXJ5IGFuZCB1bmRlcnNjb3JlIGFyZSBhbHNvIGF2YWlsYWJsZS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJ0YWItcGFuZVxcXCIgaWQ9XFxcImRhdGFUYWJsZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPmluZGV4PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+dmFsdWU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiY2hhcnREYXRhXCIsYyxwLDEpLGMscCwwLDEzNTEsMTQxOCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIDx0cj48dGQ+XCIpO18uYihfLnYoXy5mKFwiaW5kZXhcIixjLHAsMCkpKTtfLmIoXCI8L3RkPjx0ZD5cIik7Xy5iKF8udihfLmYoXCJ2YWx1ZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+PC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiBlbXBoYXNpc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RW1waGFzaXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+R2l2ZSByZXBvcnQgc2VjdGlvbnMgYW4gPGNvZGU+ZW1waGFzaXM8L2NvZGU+IGNsYXNzIHRvIGhpZ2hsaWdodCBpbXBvcnRhbnQgaW5mb3JtYXRpb24uPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB3YXJuaW5nXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5XYXJuaW5nPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPk9yIDxjb2RlPndhcm48L2NvZGU+IG9mIHBvdGVudGlhbCBwcm9ibGVtcy48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIGRhbmdlclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RGFuZ2VyPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPjxjb2RlPmRhbmdlcjwvY29kZT4gY2FuIGFsc28gYmUgdXNlZC4uLiBzcGFyaW5nbHkuPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJmaXNoaW5nUHJpb3JpdHlBcmVhXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkZpc2hpbmcgVmFsdWU8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhpcyBmaXNoaW5nIHByaW9yaXR5IGFyZWEgaW5jbHVkZXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJwZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiB0aGUgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIGZpc2hpbmcgdmFsdWUgd2l0aGluIEJhcmJ1ZGEncyB3YXRlcnMsIGJhc2VkIG9uIHVzZXIgcmVwb3J0ZWQgdmFsdWVzIG9mIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBmaXNoaW5nIGdyb3VuZHNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjUzM2YxNmY2YTQ5ODg2N2M1NmM2ZmI1N1xcXCI+c2hvdyBmaXNoaW5nIHZhbHVlcyBsYXllcjwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcImZpc2hpbmdWYWx1ZVwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5GaXNoaW5nIFZhbHVlPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoaXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJhcmVhTGFiZWxcIixjLHAsMCkpKTtfLmIoXCI8L3N0cm9uZz4gXCIpO2lmKF8ucyhfLmYoXCJpc01vb3JpbmdPclNoaXBwaW5nXCIsYyxwLDEpLGMscCwwLDEzNywxNjEsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIm1heSBwb3RlbnRpYWxseSBkaXNwbGFjZVwiKTt9KTtjLnBvcCgpO31fLmIoXCIgXCIpO2lmKCFfLnMoXy5mKFwiaXNNb29yaW5nT3JTaGlwcGluZ1wiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcImRpc3BsYWNlc1wiKTt9O18uYihcIiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJwZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiB0aGUgZmlzaGluZyB2YWx1ZSB3aXRoaW4gQmFyYnVkYeKAmXMgd2F0ZXJzLCBiYXNlZCBvbiB1c2VyIHJlcG9ydGVkXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIHZhbHVlcyBvZiBmaXNoaW5nIGdyb3VuZHMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MzNmMTZmNmE0OTg4NjdjNTZjNmZiNTdcXFwiPnNob3cgZmlzaGluZyB2YWx1ZXMgbGF5ZXI8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJoYWJpdGF0XCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlwiKTtfLmIoXy52KF8uZihcImhlYWRpbmdcIixjLHAsMCkpKTtfLmIoXCIgPGEgaHJlZj1cXFwiI1xcXCIgc3R5bGU9XFxcInRvcDowcHg7XFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MzNkZGY4NmE0OTg4NjdjNTZjNmM4MzBcXFwiPnNob3cgaGFiaXRhdHMgbGF5ZXI8L2E+PC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5IYWJpdGF0PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD4lIG9mIFRvdGFsIEhhYml0YXQ8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaGFiaXRhdHNcIixjLHAsMSksYyxwLDAsMzEzLDM3NixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPjx0ZD5cIik7Xy5iKF8udihfLmYoXCJIYWJUeXBlXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD48dGQ+XCIpO18uYihfLnYoXy5mKFwiUGVyY2VudFwiLGMscCwwKSkpO18uYihcIjwvdGQ+PC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBQZXJjZW50YWdlcyBzaG93biByZXByZXNlbnQgdGhlIHByb3BvcnRpb24gb2YgaGFiaXRhdHMgYXZhaWxhYmxlIGluIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBCYXJidWRhJ3MgZW50aXJlIDMgbmF1dGljYWwgbWlsZSBib3VuZGFyeSBjYXB0dXJlZCB3aXRoaW4gdGhpcyB6b25lLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0Pk1hcnhhbiBBbmFseXNpcyA8YSBzdHlsZT1cXFwidG9wOjBweDtcXFwiIGNsYXNzPVxcXCJtYXJ4YW4tbm9kZVxcXCIgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTMzZGUyMGFhNDk4ODY3YzU2YzZjYmE1XFxcIj5TaG93ICdTY2VuYXJpbyAxJyBNYXJ4YW4gTGF5ZXI8L2E+Jm5ic3A8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHNlbGVjdCBjbGFzcz1cXFwiY2hvc2VuXFxcIiB3aWR0aD1cXFwiMzgwcHhcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJtYXJ4YW5BbmFseXNlc1wiLGMscCwxKSxjLHAsMCw4MzEsODg2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPG9wdGlvbiB2YWx1ZT1cXFwiXCIpO18uYihfLnYoXy5kKFwiLlwiLGMscCwwKSkpO18uYihcIlxcXCI+U2NlbmFyaW8gXCIpO18uYihfLnYoXy5kKFwiLlwiLGMscCwwKSkpO18uYihcIjwvb3B0aW9uPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICA8L3NlbGVjdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJzY2VuYXJpb1Jlc3VsdHNcXFwiPjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcInZpelxcXCI+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwic2NlbmFyaW9EZXNjcmlwdGlvblxcXCI+PC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wib3ZlcnZpZXdcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7aWYoXy5zKF8uZChcInNrZXRjaENsYXNzLmRlbGV0ZWRcIixjLHAsMSksYyxwLDAsMjQsMjcwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJhbGVydCBhbGVydC13YXJuXFxcIiBzdHlsZT1cXFwibWFyZ2luLWJvdHRvbToxMHB4O1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBUaGlzIHNrZXRjaCB3YXMgY3JlYXRlZCB1c2luZyB0aGUgXFxcIlwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCJcXFwiIHRlbXBsYXRlLCB3aGljaCBpc1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgbm8gbG9uZ2VyIGF2YWlsYWJsZS4gWW91IHdpbGwgbm90IGJlIGFibGUgdG8gY29weSB0aGlzIHNrZXRjaCBvciBtYWtlIG5ld1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgc2tldGNoZXMgb2YgdGhpcyB0eXBlLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHNpemVcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlNpemU8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhpcyBhcmVhIGlzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiU1FfTUlMRVNcIixjLHAsMCkpKTtfLmIoXCIgc3F1YXJlIG1pbGVzPC9zdHJvbmc+LFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICB3aGljaCByZXByZXNlbnRzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiUEVSQ0VOVFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgQmFyYnVkYSdzIHdhdGVycy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJyZW5kZXJNaW5pbXVtV2lkdGhcIixjLHAsMSksYyxwLDAsNTM2LDExNzgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gZGlhbWV0ZXIgXCIpO2lmKCFfLnMoXy5mKFwiRElBTV9PS1wiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIndhcm5pbmdcIik7fTtfLmIoXCJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0Pk1pbmltdW0gV2lkdGg8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhlIG1pbmltdW0gd2lkdGggb2YgYSB6b25lIHNpZ25pZmljYW50bHkgaW1wYWN0cyAgaXRzIGNvbnNlcnZhdGlvbiB2YWx1ZS4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoZSByZWNvbW1lbmRlZCBzbWFsbGVzdCBkaWFtZXRlciBpcyBiZXR3ZWVuIDIgYW5kIDMgbWlsZXMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxzdHJvbmc+XCIpO18uYihcIlxcblwiICsgaSk7aWYoIV8ucyhfLmYoXCJESUFNX09LXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiICAgIFRoaXMgZGVzaWduIGZhbGxzIG91dHNpZGUgdGhlIHJlY29tbWVuZGF0aW9uIGF0IFwiKTtfLmIoXy52KF8uZihcIkRJQU1cIixjLHAsMCkpKTtfLmIoXCIgbWlsZXMuXCIpO18uYihcIlxcblwiKTt9O2lmKF8ucyhfLmYoXCJESUFNX09LXCIsYyxwLDEpLGMscCwwLDkyNiw5OTcsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICBUaGlzIGRlc2lnbiBmaXRzIHdpdGhpbiB0aGUgcmVjb21tZW5kYXRpb24gYXQgXCIpO18uYihfLnYoXy5mKFwiRElBTVwiLGMscCwwKSkpO18uYihcIiBtaWxlcy5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3N0cm9uZz5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcInZpelxcXCIgc3R5bGU9XFxcInBvc2l0aW9uOnJlbGF0aXZlO1xcXCI+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aW1nIHNyYz1cXFwiaHR0cDovL3MzLmFtYXpvbmF3cy5jb20vU2VhU2tldGNoL3Byb2plY3RzL2JhcmJ1ZGEvbWluX3dpZHRoX2V4YW1wbGUucG5nXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImFueUF0dHJpYnV0ZXNcIixjLHAsMSksYyxwLDAsMTIyMSwxMzQ1LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5cIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiIEF0dHJpYnV0ZXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihfLnJwKFwiYXR0cmlidXRlcy9hdHRyaWJ1dGVzVGFibGVcIixjLHAsXCIgIFwiKSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9cmV0dXJuIF8uZmwoKTs7fSk7XG5cbmlmKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSB0aGlzW1wiVGVtcGxhdGVzXCJdO1xufSJdfQ==
