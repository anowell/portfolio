var CV = (function () {
  var cv = {}
  var experiences = []
  var skills = []
  var timelineData = []

  cv.init = function(selectors) {
      cv.selectors = selectors || {}

      // Consider showing "loading" animation until ready to draw
      d3.json("cv.json", function(err, json) {
        if(err) { return console.log(error) }

        experiences = json.work
        skills = json.skills

        // Build the object references between skills and experiences:
        skills.forEach(function(skill, j) {
            skill.id = j
        })
        experiences.forEach(function(experience, i) {
          experience.id = i
          experience._skills = []
          experience.skills.forEach(function(skillName){
            var found = false
            skills.forEach(function(skill, j) {
              if(skillName === skill.name) {
                experience._skills.push(skill)
                // skill._exp.push(experience)
                found = true
              }
            })
            if(!found) { console.log("Unlisted skill: " + skillName)}
          })
        })

        // Build the timeline data object
        var todayTime = (new Date()).getTime()
        var parseDateToTime = function(dateStr) {
          return (dateStr) ? d3.time.format("%Y-%m-%d").parse(dateStr) : todayTime
        }
        experiences.forEach(function(experience, i) {
          if(!experience.startDate) { return }
          var times = [{
            "class": "exp-"+i,
            "starting_time": parseDateToTime(experience.startDate),
            "ending_time": parseDateToTime(experience.endDate)
          }]
          timelineData.push({"times": times})
        })

        //$("#cv").mouseleave(cv.unselectAll)

        cv.renderExp()
        cv.renderSkills(45, 3)
        cv.renderTimeline()
        cv.selectExp(experiences[0])
      })

      return cv
  }

  cv.renderTimeline = function() {
    var canvas = createCanvas(cv.selectors.timeline)

    var chart = d3.timeline()
      .width(canvas.width)
      .itemHeight(10)
      .itemMargin(-15)
      .orient("top")
      .margin({left:15, right:15, top:30, bottom:0})
      .colors(d3.scale.category10())
      .tickFormat({
        format: d3.time.format("%Y"),
        tickTime: d3.time.years,
        tickInterval: 1,
        tickSize: 8,
      })

    var node = canvas.svg.append("g")
      .attr("id", "timeline")
      .datum(timelineData)
      .call(chart)
      .on("dblclick.zoom", null)
      .on("mousewheel.zoom", null)
      .on("DOMMouseScroll.zoom", null)
      .on("wheel.zoom", null);

  }

  cv.renderExp = function() {
    var divs = experiences.map(function(exp, index) {
      return '<div data-id="'+index+'" class="exp">'+exp.company+'</div>'
    })

    var withExp = function(handler) {
      return function(evt) {
        handler.call(evt.target, experiences[evt.target.dataset.id])
      }
    }

    $(cv.selectors.experience).html(divs.join("\n"))
    $(cv.selectors.experience).on('mouseenter', '.exp', withExp(cv.selectExp))
    $(cv.selectors.experience).on('mouseleave', '.exp', withExp(cv.selectExp))
  }

  cv.renderSkills = function(maxAngle, steps) {
    maxAngle = typeof maxAngle !== 'undefined' ? maxAngle : 0;
    steps = typeof steps !== 'undefined' ? steps : 3;

    var canvas = createCanvas(cv.selectors.skills)

    var renderWords = function(words, bounds) {
      // console.log(bounds)
      canvas.svg.append("g")
        .attr("transform", "translate(" + canvas.width/2 + "," + (canvas.height/2) + ")")
        .selectAll("g.skill")
          .data(words)
            .enter()
              .append("text")
                .attr("class", function(d) { return d.ref.type + " skill" })
                .style("font-size", function(d) { return d.size + "px"; })
                .style("font-weight", "bold")
                .attr("id", function(d) { return "skill-"+d.ref.id })
                .attr("text-anchor", "middle")
                .attr("transform", function(d) {
                  return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                })
                .text(function(d) { return d.text; })
                // .on("mouseover", function(word) { return cv.selectSkill.call(this, word.ref) })
                // .on("mouseout", function(word) { return cv.unselectSkill.call(this, word.ref) })

      var iconSize = 32
      var refresh = canvas.svg.append("svg:svg")
        .attr("class", "refresh-icon")
        .attr("width", iconSize)
        .attr("x", canvas.width-iconSize)
        .attr("y", -(canvas.height-iconSize)/2)
        .attr("viewBox", "0 0 480 480")
      refresh.append("rect")
        .attr("width", 480)
        .attr("height", 480)
        .attr("fill-opacity", 0)
      refresh.append("path")
          .attr("d", "M160.469,242.194c0-44.414,36.023-80.438,80.438-80.438c19.188,0,36.711,6.844,50.5,18.078L259.78,209.93l99.945,11.367 \
                      l0.805-107.242l-30.766,29.289c-23.546-21.203-54.624-34.164-88.804-34.164c-73.469,0-133.023,59.562-133.023,133.016 \
                      c0,2.742,0.242-2.266,0.414,0.445l53.68,7.555C161.03,245.108,160.469,247.562,160.469,242.194z M371.647,237.375l-53.681-7.555 \
                      c1.017,5.086,1.556,2.617,1.556,7.992c0,44.414-36.008,80.431-80.43,80.431c-19.133,0-36.602-6.798-50.383-17.97l31.595-30.078 \
                      l-99.93-11.366l-0.812,107.25l30.789-29.312c23.531,21.141,54.57,34.055,88.688,34.055c73.468,0,133.023-59.555,133.023-133.008 \
                      C372.062,235.078,371.812,240.085,371.647,237.375z")
      refresh.on("click", function(evt) {
        switch( ~~(3*Math.random()) ) {
          case 0:
            cv.renderSkills(0, 1)
          case 1:
            cv.renderSkills(45, 2)
          default:
            cv.renderSkills(45, 3)
        }
      })
    }

    // Consider adding an element, get its style, then remove it
    // So we can set font-style and font-weight via CSS
    d3.layout.cloud()
      .size([canvas.width, canvas.height])
      .words(skills.map(function(s){
        return { text: s.name, size: Math.pow(1.4,s.weight)*9, ref: s }
      }))
      .padding(3)
      .rotate(function(d) { return steps <= 1 ? maxAngle : ~~(Math.random() * steps) * maxAngle * 2 / (steps-1) - maxAngle; })
      .fontSize(function(d) { return d.size; })
      .font("'Open Sans', sans-serif")
      .fontWeight("bold")
      .on("end", renderWords)
      .start()

    var active = d3.select('.exp.focus')
    if(!active.empty()) {
      cv.selectExp(experiences[active.attr('data-id')])
    }
  }

  cv.markdown = function(text) {
    var reLink = /\[(.+?)\]\((.+?)\)/
    var reBold = /\*(.+?)\*/
    while(text.match(reLink)) {
      text = text.replace(reLink, '<a href="$2">$1</a>')
    }
    while(text.match(reBold)) {
      text = text.replace(reBold, '<b>$1</b>')
    }
    return text
  }

  cv.renderDetails = function(exp) {
    var html = []
    var company = (exp.website) ? '<a href="'+exp.website+'">'+exp.company+'</a>' : exp.company
    var title = (exp.position) ? (exp.position+' at '+company) : company
    html.push('<h3 class="title">' + title + '</h3>')

    if(exp.summary) {
      html.push('<div class="description">' + cv.markdown(exp.summary) + '</div>')
    }

    if(exp.highlights) {
      html.push('<ul class="accomplishments">')
      exp.highlights.forEach(function(acc) {
        html.push('<li>' + cv.markdown(acc) + '</li>')
      })
      html.push('</ul>')
    }

    $(cv.selectors.details).html(html.join(""))
  }

  cv.selectExp = function(exp) {
    cv.unselectAll()
    d3.select('[data-id="'+exp.id+'"]').classed("focus", true)
    d3.select(cv.selectors.skills).classed("filtered", true)
    d3.selectAll(cv.selectors.timeline+" .exp-"+ exp.id).classed("focus", true)
    exp._skills.forEach(function(skill) {
      d3.select("#skill-" + skill.id).classed("focus", true)
    })
    cv.renderDetails(exp)
  }


  cv.unselectAll = function() {
    d3.select(cv.selectors.experience).classed("filtered", false)
    d3.select(cv.selectors.skills).classed("filtered", false)
    d3.selectAll(".focus").classed("focus", false)
    $(cv.selectors.details).html("")
  }

  cv.selectSkill = function(skill) {
    // d3.select("#explist").classed("filtered", true)
    // skill._exp.forEach(function(exp) {
    //   d3.select("#exp-" + exp.id).classed("focus", true)
    // })
  }

  cv.unselectExp = function(exp) {
    // d3.select("#cv-skills").classed("filtered", false)
    // d3.selectAll(".focus").classed("focus", false)
  }

  cv.unselectSkill = function(skill) {
    // d3.select("#explist").classed("filtered", false)
    // d3.selectAll(".focus").classed("focus", false)
  }

  var createCanvas = function(selector) {
    var root = d3.select(selector)
    if(!root.node()) {
      console.log("Failed to find selector: " + selector)
      return null
    }

    root.select("svg").remove()
    var width = root.node().clientWidth
    var height = root.node().clientHeight
    console.log(selector + " SVG size: " + width + ", " + height)

    var svg = root.append("svg:svg")
      .attr("width", width)
      .attr("height", height)
    return { svg: svg, width: width, height: height }
  }

  return cv
})()

jQuery(document).ready(function ($) {
    $(window).stellar();
    $('.tooltip').tooltipster({position:'top'});
    window.cv = CV.init({
      experience: "#cv-exp",
      skills:     "#cv-skills",
      timeline:   "#cv-timeline",
      details:    "#cv-details"
    })
});

jQuery(window).resize(function() {
    window.cv.renderSkills(45, 3)
    window.cv.renderTimeline()
});
