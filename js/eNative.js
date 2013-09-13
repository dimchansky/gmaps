define(["gmaps","knockout","underscore"],function(gmaps,ko,_) {

	var Marker = function(m,map) {
		this.id = m.id;
		this.coords = m.coords;
		this.track = m.track;
		this.trackN = 0;
		this._marker = new gmaps.Marker(new gmaps.LatLng(this.coords().lat,this.coords().lng));
		this._marker.setMap(map);
		this._trackModel = new gmaps.Polyline({
			map: map
		});
	}
	Marker.prototype.move = function() {
		this._marker.setPosition(new gmaps.LatLng(this.coords().lat,this.coords().lng));
	}
	Marker.prototype.destroy = function() {
		this._marker.setMap(null);
		this.hideTrack();
		this._trackModel.setMap(null);
	}
	Marker.prototype.drawTrack = function(key) {
		var path = this._trackModel.getPath();
		// Destroy last point that is the marker current position
		if (path.length > 0) path.pop();
		for (var i = this.trackN; i < this.track().length; i++) {
			if (this.track()[i].dt > key) break;
			path.push(new gmaps.LatLng(this.track()[i].lat,this.track()[i].lng));
		}
		this.trackN = i;
		// Add last point 
		path.push(new gmaps.LatLng(this.coords().lat,this.coords().lng));
	}
	Marker.prototype.hideTrack = function() {
		if (this.trackN === 0) return;
		var path = this._trackModel.getPath();
		path.clear();
		this.trackN = 0;
	}

	var NativeEngine = function(options) {
		var self = this;
		this.map = options.map;
		this.showTracks = options.showTracks;
		this.markers = [];
		this.syncSubscribe = ko.utils.sync({
			source: options.markers,
			target: this.markers,
			onAdd: function(m) {
				return new Marker(m,self.map);
			},
			onRemove: function(m) {
				m.destroy();
			}
		});
		options.markers.valueHasMutated();
		// The reason of using defer is that otherway callback runs before initialized new NativeEngine var is returned to constructor
		if (typeof options.callback === "function") {
			_.defer(options.callback);			
		}
	}

	NativeEngine.prototype.render = function(key,callback) {
		var self = this;
		_.each(this.markers,function(marker) {
			marker.move();
			if (self.showTracks()) {
				marker.drawTrack(key);
			}
			else {
				marker.hideTrack();
			}
		});
		if (typeof callback === "function") {
			callback();
		}
	}

	NativeEngine.prototype.resetTracks = function() {
		_.each(this.markers,function(marker) {
			marker.hideTrack();
		});
	}

	NativeEngine.prototype.destroy = function() {
		this.syncSubscribe.dispose();
		_.each(this.markers,function(marker) {
			marker.destroy();
		});
	}

	return NativeEngine;
})