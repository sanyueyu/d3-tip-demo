/*var context ="";
var view ="";
var appList = "";
var nodes = [];
var timer = "";
var intermediatestatus = [];
$(function() {
	$("#searchTopo").click(function() {
		traceID = document.getElementById("traceID").value;
		context = document.getElementById("appTopoViewer").getContext("2d");
		if(timer != "") clearInterval(timer);
		$.getJSON('/api/get_eagle_eye_data.do',{traceID: traceID}, function (data){
		var view = appTopoView(context,data,false,false);
		view.enableFlash();
		//view.show();
		view.setTooltipData = function(originData,shapeType){
			//you can set you tooltip data here
			var data = originData;
			var type = shapeType;
			return originData;//old logic
		};
		view.onShowTooltip = function(originData,displayData,shapeType){
			//here you can get you tooltip data;
			var a = originData;
			var b = displayData;
		};
		timer = setInterval(Refresh, 20000);
		});
	});
});
var showRunningStatus = function() {
	
}
var Refresh = function() {
	
	$.getJSON('/data/check.do',{appName: appList, second:600000}, function (statusData){
		var nodes = view.getNodes();
		view.loadStatusUpdate(statusData);//这是未来调用代码
		view.show();
	});
}

*/
var $ = require('jquery');
var d3 = require('d3');
var root = d3.select('#topoCanvas');

var traceID = '';
// 获取全量数据接口
var getDataUrl = '/api/get_eagle_eye_data.do';
// 获取增量数据接口 todo:change
var getStatusUrl = '/data/check.do';
// 绘图函数

var timer;
var fresh;
var draw = function(data) {
  // 用mock数据
  if (typeof data !== 'object') {
    data = JSON.parse(data);
  }
  var lenArr = data.eagleEyeLevelDOs.map(function(item) {
    return item.eagleEyeLevelInfos.length;
  });
  var lenMax = d3.max(lenArr);
  //var w = 150 * lenMax;
  var w = 1260;
  var levelWidth = 200;
  var levelHeight = lenMax * levelWidth;
  var rectTop = 30;
  var rectHeight = 40;
  var rectWidth = Math.floor(w / (2 * lenMax));
  var rectGap = rectWidth / 2;
  var h = levelHeight * (data.levelCount + 1);
  var rectPosMap = {};
  var svg = root.append('svg')
    .attr('width', w)
    .attr('height', h);

  // draw levels
  var levels = svg.append('g', 'levels')
    .attr('id', 'levels')
    .selectAll('rect')
    .data(d3.range(data.levelCount + 1))
    .enter()
    .append('rect')
    .attr('x', function(d) {
      return d * levelWidth;
    })
    .attr('y', 0)
    .attr('width', levelWidth)
    .attr('height', levelHeight)
    .attr('fill', function(d) {
      if (d%2) {
        return '#FDFFDC';
      } else {
        return '#FFFFFF';
      }
    });
  svg.select('#levels')
    .selectAll('text')
    .data(d3.range(data.levelCount + 1))
    .enter()
    .append('text')
    .text(function(d) {
      if (d === 0) {
        return 'rootLevel';
      } else {
        return 'rpcLevel:' + (d - 1);
      }
    })
    .attr('x', function(d) {
      return d * levelWidth + 10;
    })
    .attr('y', 20);

  // tooltip
  var div = root.append('div')
    .attr('id', 'tooltip')
    .style({
      position: 'absolute',
      width: '160px',
      heith: '28px',
      padding: '2px',
      border: '1px solid #ccc',
      background: '#fff',
	  'text-align': 'left',
      'border-radius': '4px'
    })
    div.on('mouseover', function() {
      d3.select(this).style('display', 'block');
    })
    .on('mouseover', function() {
      d3.select(this).style('display', 'block');
    })
    .on('mouseout', function() {
      d3.select(this).style('display', 'none');
    });


  // 画node节点
  var drawRect = function(obj, index) {
    var _idName = index !== undefined ? ('#level_' + index) : 'top';
    var _con = svg.append('g').attr('id', _idName);
    var _total = obj.eagleEyeLevelInfos.length;
    //var _left = (levelHeight - _total * rectHeight - (_total - 1) * rectGap) / 2;
    var _left = (lenMax * (rectHeight + rectGap) - _total * rectHeight - (_total - 1) * rectGap) / 2 + 20;
    var _rectGap = Math.floor(w / _total) - rectWidth;
    _con.selectAll('rect')
      .data(obj.eagleEyeLevelInfos)
      .enter()
      .append('rect')
      .attr('x', function(d, i) {
        obj.rpcLevel = obj.rpcLevel === undefined ? -1 : obj.rpcLevel;
        return levelWidth * (obj.rpcLevel + 1) + rectTop;
      })
      .attr('y', function(d, i) {
        return _left + i * rectHeight + i * rectGap;
      })
      .attr('width', rectWidth)
      .attr('height', rectHeight)
      .attr('rx', 10)
      .attr('ry', 10)
      .each(function(d, i) {
        rectPosMap[d.appId + '_' + obj.rpcLevel] = [levelWidth * (obj.rpcLevel + 1) + rectWidth / 2 + rectTop, _left + i * rectHeight + i * rectGap + rectHeight / 2,]
      })
      .attr('stroke', '#ddd')
      .attr('fill', function(d) {
        switch (d.status) {
          case 0:
            return 'green';
          case 1: 
            return 'yellow';
          case 2:
            return 'red';
          default:
            return '#fff';
        }
      })
      .style('cursor', 'pointer')
      .on('mouseover', function(d) {
        d3.select(this).attr('stroke-width', 2);
        div.style('display', 'block');
        div.html('appId:' + d.appId 
               	 + '</br>Status: '+ d.status
				 + '</br>devTL: ' + d.devTL
                 + '</br>testTL:' + d.testTL)
          .style('width', '400px')
          .style('left', d3.event.pageX + 'px')
          .style('top', d3.event.pageY  + 'px');
      })
      .on('mousemove', function(d) {
        div.style('left', d3.event.pageX + 'px')
          .style('top', d3.event.pageY + 'px');
      })
      .on('mouseout', function(d) {
        d3.select(this).attr('stroke-width', 1);
        div.style('display', 'none');
      });
    _con.selectAll('text')
      .data(obj.eagleEyeLevelInfos)
      .enter()
      .append('text')
      .text(function(d) {
        return d.serverName;
      })
      .attr('x', function(d, i) {
        return levelWidth * (obj.rpcLevel + 1) + rectWidth / 2 + rectTop;
      })
      .attr('y', function(d, i) {
        return _left + i * rectHeight + i * rectGap + rectHeight / 2 + 7;
      })
      .style('cursor', 'pointer')
      .style('font-size', '12px')
      .attr('text-anchor', 'middle')
	  .attr('text-size','10')
      .on('mouseover', function(d) {
        d3.select(this).attr('stroke-width', 2);
        div.style('display', 'block');
        div.html('appId:' + d.appId 
				 + '</br>Status: '+ d.status
                 + '</br>devTL: ' + d.devTL
                 + '</br>testTL:' + d.testTL)
          .style('width', '400px')
          .style('left', d3.event.pageX + 'px')
          .style('top', d3.event.pageY + 'px');
      })
      .on('mousemove', function(d) {
        div.style('left', d3.event.pageX + 'px')
          .style('top', d3.event.pageY + 'px');
      })
      .on('mouseout', function(d) {
        d3.select(this).attr('stroke-width', 2);
        div.style('display', 'none');
      });
  };
  drawRect({
      eagleEyeLevelInfos: [{
        appId: data.eagleEyeLevelDOs[0].eagleEyeLevelInfos[0].clientAppId,
        serverName: data.eagleEyeLevelDOs[0].eagleEyeLevelInfos[0].clientName
      }]
  });
  data.eagleEyeLevelDOs.forEach(drawRect);
  // 定义箭头
  var defs = svg.append('defs');
  var arrowMarker = defs.append('marker')
    .attr('id', 'arrow')
    .attr('markerUnits', 'strokeWidth')
    .attr('markerWidth', '12')
    .attr('markerHeight', 12)
    .attr('viewBox', '0 0 12 12')
    .attr('refX', '6')
    .attr('refY', '6')
    .attr('orient', 'auto');
  var arrow_path = "M2,2 L10,6 L2,10 L6,6 L2,2";
  arrowMarker.append('path')
    .attr('d', arrow_path)
    .attr('fill', '#000');
  // 画连接直线
  var getY = function(y, y1) {
    if (y > y1) {
      return y - rectHeight / 2;
    } else if (y < y1) {
      return y + rectHeight / 2;
    } else {
      return y;
    }
  };
  svg.append('g')
    .attr('id', 'lines')
    .selectAll('line')
    .data(data.eagleEyeLinkDOs)
    .enter()
    .append('line')
    .attr('x1', function(d) {
      var _key = d.sourceId + '_' + (d.rpcLevel - 1);
      return rectPosMap[_key][0] + rectWidth / 2;
    })
    .attr('y1', function(d) {
      var _key = d.sourceId + '_' + (d.rpcLevel - 1);
      return rectPosMap[_key][1];
    })
    .attr('x2', function(d) {
      var _key = d.targetId + '_' + d.rpcLevel;
      return rectPosMap[_key][0] - rectWidth / 2;
    })
    .attr('y2', function(d) {
      var _key = d.targetId + '_' + d.rpcLevel;
      var _key1 = d.sourceId + '_' + (d.rpcLevel - 1);
      return getY(rectPosMap[_key][1], rectPosMap[_key1][1])
    })
    .attr('marker-end', 'url(#arrow)')
    .attr('stroke', '#000')
    .style('cursor', 'pointer')
    .on('mouseover', function(d) {
      div.style('display', 'block');
      div.html('source:' + d.source + '</br>target: ' + d.serverFullName)
        .style('width', '200px')
        .style('left', d3.event.pageX + 'px')
        .style('top', d3.event.pageY + 'px');
    })
    .on('mousemove', function(d) {
      div.style('left', d3.event.pageX + 'px')
        .style('top', d3.event.pageY + 'px');
    })
    .on('mouseout', function(d) {
      d3.select(this).attr('stroke-width', 1);
      div.style('display', 'none');
    });
    // 定时刷新状态
	
    fresh = function() {
	   var serverNames = data.eagleEyeLevelDOs[0].eagleEyeLevelInfos[0].clientName;
	   data.eagleEyeLevelDOs.forEach(function(item) {
			item.eagleEyeLevelInfos.forEach(function(item1) {
			//console.log(item1);
			var index = serverNames.indexOf(item1.serverName);
			if(index == -1) {
				serverNames += ","+item1.serverName;
			}
			
		  });
		});
	//$.getJSON('/data/check.do',{appName: serverNames, second:600000}, function (_d){
	$.getJSON('http://localhost:9999/data/check.do',{appName: serverNames, second:600000}, function (_d){
		
	//  $.post('/data/check.do',{appName: serverNames}, function(_d){
		var dataStatus = _d.value;
		var dataItem = {};
		for(dataItem in dataStatus) {
			//if(dataItem.name === data.eagleEyeLevelDOs)
			data.eagleEyeLevelDOs.forEach(function(item1) {
              item1.eagleEyeLevelInfos.forEach(function(item2) {
                if (dataItem === item2.serverName) {
                  item2.status = dataItem.status;
                }
              });
            });
          };
		
		    
          data.eagleEyeLevelDOs.forEach(drawRect);
      
	  });
    };
	timer = setInterval(fresh, 20000);
 };
// 请求数据
d3.select("#searchTopo").on('click',function(){
	traceID = d3.select("#traceID").node().value;
	d3.select('svg').remove();
	clearInterval(timer);
	//$.post('/api/get_eagle_eye_data.do',{traceID: traceID}, draw);
	$.post('http://localhost:9999/api/get_eagle_eye_data.do',{traceID: traceID}, draw);
	
});
$('#searchTopo').trigger('click');

