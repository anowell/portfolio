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

        // Build the object references between skills and experiences:
        skills.forEach(function(skill, j) {
            skill.id = j
            skill._exp = []
        })
        experiences.forEach(function(experience, i) {
          experience.id = i
          experience._skills = []
          experience.skills.forEach(function(skillName){
            var found = false
            skills.forEach(function(skill, j) {
              if(skillName === skill.name) {
                experience._skills.push(skill)
                skill._exp.push(experience)
                found = true
              }
            })
            if(!found) { console.log("Unlisted skill: " + skillName)}
          })
        })

        cv.drawExp()
        cv.drawSkills(45, 3)
      })

      return cv
  }

  cv.drawExp = function() {
    var radius = 12
    var xCoord = cv.w/4 - 10 - 2*radius
    var yCoord = function(i) { return i*lineHeight+marginTop }
    var marginTop = 40
    var lineHeight = 60

    vis.select("#explist").remove()

    var node = vis.append("g")
      .attr("id", "explist")
      .selectAll("g.exp")
      .data(experiences)

    var nodeEnter = node.enter().append("svg:g")
      .attr("transform", function(d, i) { return "translate(" + 0 + "," + yCoord(i) + ")"; })
      .attr("class", "exp node")
      .attr("id", function(d) { return "exp-"+d.id })
      .on("mouseover", cv.selectExp)
      .on("mouseout", cv.unselectExp)

    nodeEnter.append("svg:rect")
      .attr("width", cv.w/4)
      .attr("height", lineHeight)
      .attr("x", 0)
      .attr("y", -lineHeight/2 + "px")

    nodeEnter.append("svg:line")
      .attr("x1", 0)
      .attr("y1", "-30px")
      .attr("x2", cv.w/4)
      .attr("y2", -lineHeight/2 + "px")

    nodeEnter.append("svg:line")
      .attr("x1", 0)
      .attr("y1", lineHeight/2 + "px")
      .attr("x2", cv.w/4)
      .attr("y2", lineHeight/2 + "px")

    nodeEnter.append("svg:circle")
      .attr("cx", xCoord)
      .attr("r", radius)

    nodeEnter.append("svg:text")
      .attr("dy", ".35em")
      .attr("x", xCoord-10-radius)
      .attr("text-anchor", "end" )
      .text(function(d) { return d.name; })
  }

  cv.drawSkills = function(maxAngle, steps) {
    maxAngle = typeof maxAngle !== 'undefined' ? maxAngle : 0;
    steps = typeof steps !== 'undefined' ? steps : 3;

    var cloud = d3.layout.cloud()
      .size([cv.w*3/4, cv.h])
      .words(skills.map(function(s){
        return { text: s.name, size: 4+s.weight*14, ref: s }
      }))
      .padding(5)

      .rotate(function(d) { return steps <= 1 ? maxAngle : ~~(Math.random() * steps) * maxAngle * 2 / (steps-1) - maxAngle; })
      .fontSize(function(d) { return d.size; })
      .on("end", function(words) {
        vis.select("#tagcloud").remove()
        vis.append("g")
            .attr("transform", "translate(" + cv.w*5/8 + "," + cv.h/2 + ")")
            .attr("id", "tagcloud")
          .selectAll("g.skill")
          .data(words)
          .enter()
          .append("text")
            .attr("class", function(d) { return d.ref.type + " skill" })
            .style("font-size", function(d) { return d.size + "px"; })
            .attr("id", function(d) { return "skill-"+d.ref.id })
            .attr("text-anchor", "middle")
            .attr("transform", function(d) {
              return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
            })
            .text(function(d) { return d.text; })
            .on("mouseover", function(word) { return cv.selectSkill.call(this, word.ref) })
            .on("mouseout", function(word) { return cv.unselectSkill.call(this, word.ref) })
      })
      .start()
  }

  cv.selectExp = function(exp) {
    d3.select(this).classed("hover", true)
    d3.select("#tagcloud").classed("filtered", true)
    exp._skills.forEach(function(skill) {
      d3.select("#skill-" + skill.id).classed("focus", true)
    })
  }

  cv.selectSkill = function(skill) {
    d3.select(this).classed("hover", true)
    d3.select("#explist").classed("filtered", true)
    skill._exp.forEach(function(exp) {
      d3.select("#exp-" + exp.id).classed("focus", true)
    })
  }

  cv.unselectExp = function(exp) {
    d3.select(this).classed("hover", false)
    d3.select("#tagcloud").classed("filtered", false)
    d3.selectAll(".focus").classed("focus", false)
  }

  cv.unselectSkill = function(skill) {
    d3.select(this).classed("hover", false)
    d3.select("#explist").classed("filtered", false)
    d3.selectAll(".focus").classed("focus", false)
  }

  return cv
})()

jQuery(document).ready(function ($) {
    $(window).stellar();
    window.cv = CV.init("#cv")
});
