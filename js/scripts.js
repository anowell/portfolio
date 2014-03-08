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

        experiences = json.experiences
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
          if(!experience.times) { return }
          var times = []
          experience.times.forEach(function(time) {
            times.push({
              "class": "exp-"+i,
              "starting_time": parseDateToTime(time.start),
              "ending_time": parseDateToTime(time.end)
            })
          })
          if(times.length > 0) {
            timelineData.push({"times": times})
          }
        })

        $("#cv").mouseleave(cv.unselectAll)

        cv.renderExp()
        cv.renderSkills(45, 3)
        cv.renderTimeline()
      })

      return cv
  }

  cv.renderTimeline = function() {
    var canvas = createCanvas(cv.selectors.timeline)

    var chart = d3.timeline()
      .width(canvas.width)
      .margin({left:5, right:5, top:30, bottom:30})
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
  }

  cv.renderExp = function() {
    var divs = experiences.map(function(exp, index) {
      return '<div data-id="'+index+'" class="exp">'+exp.name+'</div>'
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
    }

    // Consider adding an element, get its style, then remove it
    // So we can set font-style and font-weight via CSS
    d3.layout.cloud()
      .size([canvas.width, canvas.height])
      .words(skills.map(function(s){
        return { text: s.name, size: Math.pow(1.8,s.weight)*8, ref: s }
      }))
      .padding(3)
      .rotate(function(d) { return steps <= 1 ? maxAngle : ~~(Math.random() * steps) * maxAngle * 2 / (steps-1) - maxAngle; })
      .fontSize(function(d) { return d.size; })
      .font("'Open Sans', sans-serif")
      .fontWeight("bold")
      .on("end", renderWords)
      .start()
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
    var title = (exp.title) ? (exp.title+' at '+exp.name) : exp.name
    html.push('<h3 class="title">' + title + '</h3>')

    if(exp.description) {
      html.push('<div class="description">' + cv.markdown(exp.description) + '</div>')
    }

    if(exp.accomplishments) {
      html.push('<ul class="accomplishments">')
      exp.accomplishments.forEach(function(acc) {
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
    window.cv = CV.init({
      experience: "#cv-exp",
      skills:     "#cv-skills",
      timeline:   "#cv-timeline",
      details:    "#cv-details"
    })
});
