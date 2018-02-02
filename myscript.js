let myBasemap;
let mapView;
let basemapsArr;
let basemapList = document.getElementById("basemapList");
let btnsDiv = document.getElementById("btnsDiv");
let basemapsDiv = document.getElementById("basemapsDiv");
let basemapBtns = document.getElementsByClassName("basemapBtn");
let basemapCheckbox = document.getElementById("basemapCheckbox");
let intialExtent = document.getElementById("intialExtent");
let initialCenter;
let viewOptions;
let url;
let agsServices = document.getElementById("agsServices");
let loadServicesBtn = document.getElementById("loadServicesBtn");
let layer;
let services;
let toc = document.getElementById("toc");
let map;
let agsServers = document.getElementById("agsServers");
let basemapChbox = document.getElementById("basemapChbox")
let errorSpan = document.getElementById("errorSpan");

require( ["esri/Map", "esri/views/MapView", "esri/request", "esri/layers/MapImageLayer", "esri/config", "esri/widgets/Legend"], 
        function(Map, MapView, esriRequest, MapLayer, esriConfig, Legend)
        {
  esriConfig.request.corsEnabledServers.push("capgeo.sig.paris.fr", "sampleserver6.arcgisonline.com", "bidon.com", "maps5.arcgisonline.com" );
  myBasemap = new Map( { basemap: "dark-gray" } );
  basemapsArr = ["osm", "topo", "streets", "satellite", "hybrid", "gray", "dark-gray", "streets-night-vector"];
  parisExtent = [2.339733839034574, 48.85789641531674];
  initialCenter = [-30.396434068671454, 44.956249723547664];
  viewOptions = { container: "mapview", map: myBasemap, center: initialCenter, zoom: 3 };
  mapView = new MapView( viewOptions );
  let legend = new Legend({view: mapView});
  mapView.ui.add(legend, "bottom-right");
  intialExtent.classList += " animated bounceInLeft";
  basemapChbox.classList += " animated bounceInLeft";
  loadServicesBtn.classList += " animated bounceInRight";
  agsServers.classList += " animated flipInX";
  url = agsServers.options[agsServers.selectedIndex].getAttribute("url");
  // Event listener get url from agsServers list
  agsServers.addEventListener("change" , function(){
    errorSpan.style.display = "none";
    errorSpan.classList.remove("animated", "flash");
    errorSpan.innerHTML = "";
    url = this.options[this.selectedIndex].getAttribute("url");
    agsServices.classList.remove("animated", "flipInX");
    loadServicesBtn.disabled = false;
    agsServices.innerHTML = "";
    toc.innerHTML = "";
    mapView.map.removeAll();
  });
  function createSelectWithOptgroup(url) {
    let select = document.createElement("select");
    esriRequest(url + "?f=pjson", {
      responseType: "json"/*, timeout: 3000*/
    }).then(function(response){
      let result = response.data;
      select.className = "form-control list";
      let folders = result["folders"];
      let services = result.services;
      if(folders.length > 0 ) {
        for (let i = 0, l = folders.length; i < l; i++)  {
          let optgroup = document.createElement("optgroup");
          optgroup.label = folders[i].toUpperCase();
          esriRequest(url + "/" + folders[i] + "?f=pjson", {
            responseType: "json"
          }).then(function(response){
            let result = response.data;
            let services = result["services"];
            for (var i = 0, l = services.length; i < l; i++)  {

              let type = services[i].type;
              if ( type == "MapServer") {
                let option = document.createElement("option");
                let service = services[i].name.split("/")[1];
                option.value = service;
                option.textContent = service;
                option.setAttribute("url", url + "/" + services[i].name + "/" + type);
                optgroup.appendChild(option);
              }
            }
            select.appendChild(optgroup);
          })
        }
      }
      if (services.length) {
        for (let i = 0, l = services.length; i < l; i++)  {
          let type = services[i].type;
          if ( type == "MapServer") {
            let option = document.createElement("option");
            let service = services[i].name;
            myService = services[i];
            option.value = service;
            option.textContent = service;
            option.setAttribute("url", url + "/" + services[i].name + "/" + type);
            select.appendChild(option);
          }
        }
      }
      agsServices.appendChild(select);/**/
      agsServices.classList += " animated flipInX";
      select.addEventListener("change", function() {
        let service = this.options[this.selectedIndex].getAttribute("url");
        toc.innerHTML = "";
        layer = new MapLayer( {url: service});
        mapView.map.removeAll();
        mapView.map.add(layer);
        layer.then(() =>
        {
          if((/^(https:\/\/)capgeo.sig.paris.fr/).test(url)) {
            mapView.center = parisExtent;	
            mapView.zoom = 12;
          } else {
            mapView.goTo(layer.fullExtent);
          }
          let span = document.createElement("span");
          span.className = "titleLayer";
          span.innerHTML = service;
          let btn = document.createElement("button");							
          btn.id = "btn"
          btn.className = "btn btn-warning btn-sm glyphicon glyphicon-remove";
          btn.appendChild(span);
          btn.addEventListener("click", function() {
            toc.innerHTML = "";
            mapView.map.removeAll();
          });
          let br = document.createElement("br");
          let br2 = document.createElement("br");
          toc.appendChild( btn );
          toc.appendChild(span);
          toc.appendChild(br);
          toc.appendChild(br2);
          createChkBoxForSublayer(layer);
        });
      });

    }).otherwise(errback);
  }
  // Executes if data retrieval was unsuccessful.
  function errback(error) {
    errorSpan.style.display = "inline";
    errorSpan.className += " animated flash";
    errorSpan.innerHTML = error.message;
  }
  // Create checkbox for sublayers
  function createChkBoxForSublayer( layer ) {
    for (var i = 0, len = layer.sublayers.items.length; i < len; i++)  {
      let sublayer = layer.sublayers.items[i];
      let checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = sublayer.id;
      checkbox.id = "chk"+sublayer.id;
      checkbox.checked = sublayer.title;
      checkbox.classList.add("animated", "bounceInLeft");
      let label = document.createElement("label");
      label.textContent = sublayer.title;
      label.style.margin = "0px 10px";
      label.setAttribute("for", "chk"+sublayer.id);
      label.classList.add("animated", "bounceInRight")
      let br = document.createElement("br");
      toc.appendChild(checkbox);
      toc.appendChild(label);
      toc.appendChild(br);
      sublayerIsVisible(checkbox, sublayer);
    }

  }/**/
  // Sublayer visible or not when checkbox is checked or not 
  function sublayerIsVisible(checkbox, sublayer) {
    checkbox.addEventListener( 'change', function() {
      if(this.checked) {
        sublayer.visible = true;
      } else {
        sublayer.visible = false;
      }
    });
  }
  // Load services when button is clicked
  loadServicesBtn.addEventListener("click", function(e) {
    e.target.disabled = true;
    createSelectWithOptgroup(url);
  });
  // Go to initial extent
  intialExtent.onclick = function() {
    mapView.center = initialCenter;	
    mapView.zoom = 3;
  }
  // Animate basemap button 
  basemapCheckbox.onclick = function() {
    if(this.checked) {
      basemapsDiv.style.display = "block";
      btnsDiv.className = "animated flipInX";
      basemapList.style.display = "block";
      basemapList.className += " animated flipInX"
    }
    else
    {
      basemapsDiv.style.display = "none";
      btnsDiv.className = "";
      basemapList.style.display = "";
      basemapList.classList.remove("animated", "flipInX");
    }
  }
  // Change basemap when option in list change
  basemapList.onchange = function() {

    switch ( basemapList.value ) {
      case "osm":
        myBasemap.basemap = "osm";
        break;
      case "streets":
        myBasemap.basemap = "streets";
        break;
      case "topo":
        myBasemap.basemap = "topo";
        break;
      case "satellite":
        myBasemap.basemap = "satellite";
        break;
      case "hybrid":
        myBasemap.basemap = "hybrid";
        break;
      case "gray":
        myBasemap.basemap = "gray";
        break;
      case "dark-gray":
        myBasemap.basemap = "dark-gray";
        break;
      case "streets-night-vector":
        myBasemap.basemap = "streets-night-vector";
        break;
    }/**/
  }
  // Change basemap onclick button
  for (var i = 0, len = basemapBtns.length; i < len; i++) {
    let btnBsmap = basemapBtns[i];
    btnBsmap.addEventListener("click", function() {
      basemapList.value = this.id;
      myBasemap.basemap = this.id;
    });
  };/**/
  // Move the legend from left to right OR from right to left 
  setTimeout(()=>{
    let myLegend = document.querySelector(".esri-legend");
    let divLegend = myLegend.parentElement;
    divLegend.onmouseover = () => {
      divLegend.style.cursor = "pointer";
    }
    divLegend.onclick = () => {
      divLegend.classList.toggle("esri-ui-bottom-left");
      divLegend.classList.toggle("esri-ui-bottom-right");
    }/**/
  }, 1000);
}
);