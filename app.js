//Asignacion de varibles tamaños graficos
var chart_width     =   800;
var chart_height    =   600;
var centered;

var splot_width = 800;
var splot_height = 500;

var pie_width =800;
var pie_height= Math.min(pie_width, 500);
var radius = Math.min(pie_width, pie_height)/2;

var arc = d3.arc()
  .innerRadius(radius * 0.60)
  .outerRadius(radius - 5);


var margin  = {
        top: 20,
        botton: 50,
        left:120,
        right:50
            
    };


var color = d3.scaleLinear() 
    .domain([1, 20])
    .clamp(true)
    .range(['white', '#409A99']);

var projection = d3.geoMercator()
    .scale(12000/ 2 / Math.PI)
    .center([-74, 4.5])
    .translate([chart_width / 2, chart_height / 2]);

var path = d3.geoPath()
    .projection(projection);

    
// Create SVG
var svg = d3.select("#chart")
    .append("svg")
    .attr("width", chart_width)
    .attr("height", chart_height);

var  titulo_sp= d3.select("#titulo")
        .text("Variación anual");

var svg_sp = d3.select("#scatterplot")
                .append("svg")
                .attr("width", splot_width)
                .attr("height", splot_height);

var svg_path = svg_sp.append("path");

var svg_pie = d3.select("#pie")
      .append("svg")
      .attr("width", pie_width)
      .attr("height", pie_height)
      .attr("viewBox", [-pie_width / 2, -pie_height / 2, pie_width, pie_height])
      .style("width",pie_width)
      .style("height",pie_height);

var pie = d3.pie()
      .padAngle(1 / radius)
      .sort(null)
      .value(d => d.COBERTURA_NETA_SECUNDARIA);

// Add background
svg.append('rect')
  .attr('class', 'background')
  .attr('width', chart_width)
  .style('fill', 'white')
  .attr('height', chart_height);

var g = svg.append('g');
 
var mapLayer = g.append('g')
  .classed('map-layer', true);

//add Tooltip
    var tooltip = d3.select ("body")
                    .append("div")
                    .attr("class","tooltip");

//Data

var dataset =[];

d3.json("colombia-dep.json").then(function(data){
    var features = data.features;

    // Update color scale domain based on data
  color.domain([0, d3.max(features, nameLength)]);

   
  mapLayer.selectAll('path')
        .data(data.features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('vector-effect', 'non-scaling-stroke')
        .style('fill', fillFn)
        .on('mouseover', mouseover)
        .on('mouseout', mouseout)
        .on('click', click)
        .attr('d', path);
});

var escalaX = null;
var escalaY= null;
var focus = null;
var focusText= null;

// Creación titulo interactivo
function actualizaTitulo (nuevo){
  titulo_sp.text("Variación anual - Dpto. " + nuevo)
  }

  //Creación funcion al clickear
function click(d){
  pintarLineas(nameFn(d));
  actualizaTitulo(d.properties.NOMBRE_DPT);
  deptopie2(d.properties.NOMBRE_DPT)
}


d3.csv("MEN_ESTADISTICAS_EN_EDUCACION_EN_PREESCOLAR__B_SICA_Y_MEDIA_POR_DEPARTAMENTO_20231022.csv").then(function(data){
    dataset =data;
    

     // Escalas
    escalaX = d3.scaleLinear()
                    .domain (d3.extent(dataset, d => d.AÑO))
                    .range ([0 + margin.left, splot_width - margin.right]);
    
    
    escalaY= d3.scaleLinear()
                   .domain ([50, d3.max(dataset, function(d) { return d.COBERTURA_NETA; })])
                   .range ([splot_height - margin.botton, 0 + margin.top]);
    
    
    // Ejes
    var ejeX = d3.axisBottom (escalaX);
    
// Agrega el eje X
svg_sp.append("g")
    .attr("transform", "translate(0," + (splot_height - margin.botton + 5) + ")")
    .call(ejeX);

// Agrega una etiqueta al eje X
svg_sp.append("text")
    .attr("class", "axis-label")
    .text("AÑO")
    .attr("x", splot_width / 2)
    .attr("y", splot_height - 1)
    .style("text-anchor", "middle");

// Estilo para la etiqueta del eje X
svg_sp.select(".axis-label")
    .style("font-size", "20px")
    .style("fill", "black");

     var ejeY = d3.axisLeft (escalaY);
    
    svg_sp.append("g")
               .attr("transform","translate (" + margin.left + ",0)")
               // Añadimos una transicion
               .transition()
               .duration (1000)
               // https://d3js.org/d3-ease#easeBack
               .ease(d3.easeBackIn)
             //.ease (d3.easeBounce) 
               .delay (500)  //Demora inicio animación
               .call(ejeY);
    
     focus = svg_sp.append('g')
    .append('circle')
    .style("fill", "none")
    .attr("stroke", "black")
    .attr('r', 8.5)
    .style("opacity", 0);
    
    focusText = svg_sp
        .append('g')    
        .append('text')      
        .style("opacity", 0)      
        .attr("text-anchor", "left")      
        .attr("alignment-baseline", "middle");
 
      
//CREACION PIE CON DATOS FILTRADOS POR AÑO Y POR DEPARTAMENTO
      var datafiltros=dataset.filter(function(d){
        return d.AÑO === "2022" 
      })
   
      var colorP = d3.scaleOrdinal()
            .domain(datafiltros.map(d => d.COBERTURA_NETA_SECUNDARIA))
            .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), data.length).reverse());

   
    
//Agregacion datos pie
    svg_pie.append("g")
      .selectAll()
      .data(pie(datafiltros))
      .join("path")
      .attr("fill", d => colorP(d.DEPARTAMENTO))
      .attr("d", arc)
      .append("title")
     
      
    svg_pie.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 12)
      .attr("text-anchor", "middle")  
      .selectAll()
      .data(pie(datafiltros))
      .join("text")
      .attr("transform", d => `translate(${arc.centroid(d)})`)
      .call(text => text.append("tspan")
          .attr("y", "-0.4em")
          .attr("font-weight", "bold")
          .text(d => d.data.DEPARTAMENTO))
          .call(text => text.filter(d => (d.endAngle - d.startAngle) > 0.25).append("tspan"))
          .attr("x", 0)
          .attr("y", "0.7em")
          .attr("fill-opacity", 0.7)
          .text(d => d.data.COBERTURA_NETA_SECUNDARIA)
          .text(d => d.data.COBERTURA_NETA_SECUNDARIA.toLocaleString("Educación Secundaria"))


});


function mouseover(d){
    // Highlight hovered province
    d3.select(this).style('fill', '#20c997');
    pintarTooltip(d);
  
  }

function mouseout(d){
    // Reset province color
    mapLayer.selectAll('path')
      .style('fill', function(d){return centered && d===centered ? '#20c997' : fillFn(d);});
    
    borrarTooltip();
  
  }



// Get province name
function nameFn(d){
    return d && d.properties ? d.properties.NOMBRE_DPT : null;
  }


 // Get province name length
function nameLength(d){
    var n = nameFn(d);
    return n ? n.length : 0;
  }

  // Get province color
function fillFn(d){
    return color(nameLength(d));
  }



//tooltip
function pintarTooltip(d){
        var deptoData = encontrarLastData(nameFn(d));
        tooltip 
       .text(nameFn(d) + " : " + deptoData.COBERTURA_NETA + "%")
       .style ("top", d3.event.pageY + "px")
       .style ("left", d3.event.pageX + "px")
       // Para que la aparición no se brusca
       //.transition()
       .style("opacity",1);   
    }
function borrarTooltip(){
     tooltip// .transition()
    .style("opacity",0);         
}

//Find data
function encontrarLastData(depto){
    var filteredData = dataset.filter(function(d) {
        return d['AÑO'] === "2022";
    }); 
    
     var filteredData2 = filteredData.filter(function(d) {
        return d['DEPARTAMENTO'] === ajustarTexto(depto);
    });
    
    return filteredData2[0];
    
}

function encontrarData(depto){
  
     var filteredData = dataset.filter(function(d) {
        return d['DEPARTAMENTO'] === ajustarTexto(depto);
    });
    return filteredData;
    
}


function deptopie2(depto){

  var datafiltros = dataset.filter(function(d) {
    return d.AÑO === "2022" && d.NOMBRE_DPT === depto;;
  });
  }

//Ajuste de textos en mapas vs data 
function ajustarTexto(depto){
    if (depto == "LA GUAJIRA"){ return "La Guajira";}
    else if (depto == "ANTIOQUIA"){return "Antioquia";}
    else if (depto == "ATLANTICO"){return "Atlántico";}
    else if (depto == "BOGOTA"){return "Bogotá, D.C.";}
    else if (depto == "BOLIVAR"){return "Bolívar";}
    else if (depto == "BOYACA"){return "Boyacá";}
    else if (depto == "CALDAS"){return "Caldas";}
    else if (depto == "CAQUETA"){return "Caquetá";}
    else if (depto == "CAUCA"){return "Cauca";}
    else if (depto == "CESAR"){return "Cesar";}
    else if (depto == "CORDOBA"){return "Córdoba";}
    else if (depto == "CUNDINAMARCA"){return "Cundinamarca";}
    else if (depto == "MAGDALENA"){return "Magdalena";}
    else if (depto == "META"){return "Meta";}
    else if (depto == "NARIÑO"){return "Nariño";}
    else if (depto == "NORTE DE SANTANDER"){return "Norte de Santander";}
    else if (depto == "QUINDIO"){return "Quindio";}
    else if (depto == "RISARALDA"){return "Risaralda";}
    else if (depto == "SANTANDER"){return "Santander";}
    else if (depto == "SUCRE"){return "Sucre";}
    else if (depto == "TOLIMA"){return "Tolima";}
    else if (depto == "VALLE DEL CAUCA"){return "Valle del Cauca";}
    else if (depto == "ARAUCA"){return "Arauca";}
    else if (depto == "CASANARE"){return "Casanare";}
    else if (depto == "PUTUMAYO"){return "Putumayo";}
    else if (depto == "AMAZONAS"){return "Amazonas";}
    else if (depto == "GUAINIA"){return "Guainía";}
    else if (depto == "GUAVIARE"){return "Guaviare";}
    else if (depto == "VAUPES"){return "Vaupés";}
    else if (depto == "VICHADA"){return "Vichada";}
    else if (depto == "HUILA"){return "Huila";}
    else if (depto == "CHOCO"){return "Chocó";}
    
}


//pintar diagrama de lineas

function pintarLineas(depto){
    
    console.log("clicked: " + depto);
    
    var datosDepto = encontrarData(depto);
    
   
    console.log(datosDepto);
    
    
    var line = d3.line()
    .x(function(d) { return escalaX(d.AÑO); })
    .y(function(d) { return escalaY(d.COBERTURA_NETA); });

    svg_path
      .datum(datosDepto)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("d", line)
      .on("mouseover",mousemove);
     
    }

    
function mousemove(d) {    // recover coordinate we need 
    var x0 = escalaX.invert(d3.mouse(this)[0]);
    var i = bisect(d, x0, 1);
    selectedData = d[i]; 
     tooltip 
       .text(selectedData.AÑO + " / " + selectedData.COBERTURA_NETA)
       .style ("top", d3.event.pageY + "px")
       .style ("left", d3.event.pageX + "px")
       // Para que la aparición no se brusca
       //.transition()
       .style("opacity",1); 

      
}  


var bisect = d3.bisector(function(d) { return d.AÑO; }).left;





 
