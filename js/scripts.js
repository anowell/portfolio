var CV = (function () {
  var cv = {}
  var experiences = []
  var skills = []
  var vis = null

  cv.init = function(selector) {
      var root = d3.select(selector)
      cv.w = root.node().clientWidth;
      cv.h = root.node().clientHeight;

      var svg = root.append("svg:svg")
        .attr("width", cv.w)
        .attr("height", cv.h)

      vis = svg.append("svg:g").attr("id", "vis")
        .attr("width", cv.w)
        .attr("height", cv.h)

      console.log("SVG Size: " + cv.w + ", " + cv.h)

      // Consider showing "loading" animation until ready to draw
      d3.json("cv.json", function(err, json) {
        if(err) { return console.log(error) }

        experiences = json.experiences
        skills = json.skills

        // Position CV text (marginTop, lineHeight)
        cv.positionSkills(40, 30)
        cv.positionExp(40, 60)

        // Build the node connection lookups:
        experiences.forEach(function(experience) {
          experience._skills = []
          experience.skills.forEach(function(skillName){
            skills.forEach(function(skill) {
              if(skillName === skill.name) {
                experience._skills.push(skill)
                skill._exp.push(experience)
              }
            })
          })
        })

        cv.drawExp(vis)
        cv.drawSkills(vis)
      })

      return vis
  }

  cv.positionExp = function(marginTop, lineHeight) {
    for(var i=0; i<experiences.length; ++i) {
      experiences[i].x = cv.w/2
      experiences[i].y = marginTop + i*lineHeight
      experiences[i].w = 60
      experiences[i].r = 20
    }
  }

  cv.positionSkills = function(marginTop, lineHeight) {
    var lpos = marginTop
    var rpos = marginTop
    skills.forEach(function(skill) {
      skill._exp = []
      skill.r = 10
      if(skill.type == "language") {
        skill.x = cv.w/4
        skill.y = lpos
        lpos += lineHeight
      } else {
        skill.x = 3*cv.w/4
        skill.y = rpos
        rpos += lineHeight
      }
    })
  }

  cv.drawExp = function() {
    var node = vis.selectAll("g.exp")
      .data(experiences)

    var nodeEnter = node.enter().append("svg:g")
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
      .attr("class", "exp node")
      .on("mouseover", cv.selectExp)
      .on("mouseout", cv.unselectExp)

    nodeEnter.append("svg:circle")
      .attr("cx", function(d) { return -d.r-d.w })
      .attr("r", function(d) { return d.r })

    nodeEnter.append("svg:circle")
      .attr("cx", function(d) { return d.r+d.w})
      .attr("r", function(d) { return d.r })

    nodeEnter.append("svg:text")
      .attr("dy", ".35em")
      .attr("text-anchor", "middle" )
      .text(function(d) { return d.name; })
  }

  cv.drawSkills = function() {
    var node = vis.selectAll("g.skill")
      .data(skills)

    var nodeEnter = node.enter().append("svg:g")
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
      .attr("class", function(d) { return d.type + " skill node"})
      .on("mouseover", cv.selectSkill)
      .on("mouseout", cv.unselectSkill)

    nodeEnter.append("svg:circle")
      .attr("cx", function(d) { return (d.x < cv.w/2) ? +20 : -20 })
      .attr("r", 10)

    nodeEnter.append("svg:text")
      .attr("dy", ".35em")
      .attr("text-anchor",  function(d) { return (d.x < cv.w/2) ? "end" : "start" } ) // or end
      .text(function(d) { return d.name; })
  }

  cv.drawBranches = function(lineData) {
    var splineLine = d3.svg.line()
      .interpolate("basis")

    d3.select("#vis").selectAll(".branch")
      .data(lineData)
      .enter()
      .insert("svg:path", "g")
      .attr("class", "branch")
      .attr("d", splineLine)
  }

  cv.getLineData = function(exp, skill) {
    var start = {
      x: (skill.x < cv.w/2) ? exp.x-exp.w-2*exp.r : exp.x+exp.w+2*exp.r,
      y: exp.y
    }
    var end = {
      x: (skill.x < cv.w/2) ? skill.x+30 : skill.x-30,
      y: skill.y
    }

    var looseness = 0.8
    var spline = {
      x: start.x + looseness * (end.x-start.x),
      y: start.y + looseness + (end.y-start.y)
    }

    return [[start.x, start.y], [spline.x, spline.y], [end.x, end.y]]
  }

  cv.selectExp = function(exp) {
    this.parentNode.appendChild(this)
    d3.select(this).classed("hover", true)

    var lineData = []
    exp._skills.forEach(function(skill) {
      lineData.push(cv.getLineData(exp, skill))
    })

    cv.drawBranches(lineData)
  }

  cv.selectSkill = function(skill) {
    d3.select(this).classed("hover", true)

    var lineData = []
    skill._exp.forEach(function(exp) {
      lineData.push(cv.getLineData(exp, skill))
    })

    cv.drawBranches(lineData)
  }

  cv.unselectExp = function(exp) {
    d3.select(this).classed("hover", false)
    d3.selectAll(".branch").remove()
  }

  cv.unselectSkill = function(skill) {
    d3.select(this).classed("hover", false)
    d3.selectAll(".branch").remove()
  }

  return cv
})()


jQuery(document).ready(function ($) {
    $(window).stellar();
    CV.init("#cv")
});
