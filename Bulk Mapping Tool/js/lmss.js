// MIT License

// Copyright (c) 2023 Thomson Reuters

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

// Endpoint for the LMSS Suggestion API
endpoint = "http://localhost:8888"

body = d3.select("body")

header = body.append("header")
header.append("div").classed("headerImg", true)
header.append("div").classed("headerText", true).html("SALI LMSS Classification Engine")

bodyText = body.append("div").classed("contentContainer", true)
bodyText.append("h1").html("SALI Bulk Classification Tool")
bodyText.append("p").html("This tool allows users to easily classify taxonomies in bulk to adhere to the SALI Legal Matter Standard Specification.")
bodyText.append("p").html("As a shared service relying on external APIs, you may experience delays in response times. Further, information sent to this service may be cached or transmitted to third parties like OpenAI for further processing.")
bodyText.append("p").html("If you need to process sensitive information, process a large number of records, or improve accuracy and speed for specific use cases, we recommend using the API or source code directly or contacting us for assistance.")

choices = [{
    "label": "Area of Law",
    "id": "area-of-law"
}, {
    "label": "Service",
    "id": "service"
}, {
    "label": "Actor / Player",
    "id": "actor-player"
}, {
    "label": "Standards Compatibility",
    "id": "standards-compatibility"
}, {
    "label": "Document / Artifact",
    "id": "document-artifact"
}]
gptkey = bodyText.append("div").classed("category results", true)
gptkey.append("div").classed("categoryText", true).html("Provide your OpenAI API key")
gptkey.append("p").html("An optional step, however if you would like Large Language Model capabilities when classifying your taxonomy please go to ").append("a").html("openai.com").attr("href","https://openai.com/")
gptkey.append("input").attr("id", "gptKey").attr("placeholder","Paste OpenAI api key here")
resultsChoices = bodyText.append("div").classed("category results", true)
resultsChoices.append("div").classed("categoryText", true).html("Select the amount of results you would like to receive from each LMSS category")
resultsChoice = resultsChoices.selectAll("body").data(choices).enter().append("div").classed("choiceContainer", true)
resultsChoice.append("input").attr("type", "number").attr("id", d => d.id).attr("value", 0)
resultsChoice.append("div").classed("choice", true).html(d => d.label)

uploadForm = bodyText.append("form").attr("method", "post").attr("enctype", "multipart/form-data")
uploadForm.append("input").attr("type", "file").attr("name", "file").attr("accept", ".csv").attr("id", "fileUpload")
uploadForm.append("div").classed("uploadImg", true).html("select files")
downloadTemplate = header.append("div").classed("template", true).append("a").html("Download Upload Template").attr("href", "template.csv")




uploadForm.on("click", function(d) {
    var upload = document.getElementById("fileUpload");
    upload.click()
})

gptKey = $("#gptKey").val()


document.querySelector(`#fileUpload`).onchange = async e => {


areaOfLawValue = $("#area-of-law").val()
serviceValue = $("#service").val()
actorPlayerValue = $("#actor-player").val()
standardsCompatibilityValue = $("#standards-compatibility").val()
documentArtifcatValue = $("#document-artifact").val()

searchSum = parseInt(areaOfLawValue) + parseInt(serviceValue) + parseInt(actorPlayerValue) + parseInt(standardsCompatibilityValue) + parseInt(documentArtifcatValue)


    const input = e.target
    const file = input.files[0]
    const reader = new FileReader()
    reader.readAsText(new Blob(
        [file], {
            "type": file.type
        }
    ))
    const fileContent = await new Promise(resolve => {
        reader.onloadend = (event) => {
            resolve(event.target.result)
        }
    })
    const csvData = d3.csvParse(fileContent)
    console.log(csvData)




    if (gptKey.length < 1) {
        // body.remove()
        alert("OpenAI API key not provided")
            // location.reload();

    }
    console.log(standardsCompatibilityValue)
    console.log(parseInt(standardsCompatibilityValue))
console.log(searchSum)
    if (searchSum < 1) {
        // body.remove()
        alert("No LMSS Categories selected")
        location.reload();

    }


    $('.uploadButton').click(function() {
        console.log("this happened")
        $("#fileUpload").click();
    });

    // $('#fileUpload').change(function(e) {

    bodyText.style("opacity", 0)
    var ext = $('#fileUpload').val().split(".").pop().toLowerCase();

    if ($.inArray(ext, ["csv"]) == -1) {
        $('#csvErr').css('display', 'block');
        $('#csvOk').css('display', 'none');
        return false;
    } else {
        $('#csvErr').css('display', 'none');
        $('#csvOk').css('display', 'block');
    }
    if (e.target.files != undefined) {



        uploadTable = body.append("div").classed("tableContainer", true)
        uploadTable.append("div").classed("tableTitle", true).html("Uploaded Data")
        resultsTable = uploadTable.append("div").classed("tableWrapper", true).append("table").append("tbody")
        download = body.append("a").html("Download CSV").classed("export", true)
        suggestionContainer = body.append("div").classed("suggestionContainer", true)
        suggestionTitle = suggestionContainer.append("div").classed("suggestionsTitle", true).html("Matched LMSS Labels")

        tableRow = resultsTable.append("tr")
            // var csvval = e.target.result.split("\n");
        var headerLabel = csvData.shift()
            // console.log(csvval)

        headerLabels = ["Search Term", "Definition", "Section", "SALI Label", "Definition", "IRI", "Source", "Score"]



        function exportTableToCSV($table, filename) {

            var $rows = $table.find('tr:has(td)'),

                // Temporary delimiter characters unlikely to be typed by keyboard
                // This is to avoid accidentally splitting the actual contents
                tmpColDelim = String.fromCharCode(11), // vertical tab character
                tmpRowDelim = String.fromCharCode(0), // null character

                // actual delimiter characters for CSV format
                colDelim = '","',
                rowDelim = '"\r\n"',

                // Grab text from table into CSV formatted string
                csv = '"' + $rows.map(function(i, row) {
                    var $row = $(row),
                        $cols = $row.find('td');

                    return $cols.map(function(j, col) {
                        var $col = $(col),
                            text = $col.text();

                        return text.replace(/"/g, '""'); // escape double quotes

                    }).get().join(tmpColDelim);

                }).get().join(tmpRowDelim)
                .split(tmpRowDelim).join(rowDelim)
                .split(tmpColDelim).join(colDelim) + '"',

                // Data URI
                csvData = 'data:application/csv;charset=utf-8,' + encodeURIComponent(csv);

            $(this)
                .attr({
                    'download': filename,
                    'href': csvData,
                    'target': '_blank'
                });
        }

        // This must be a hyperlink
        $(".export").on('click', function(event) {
            // CSV
            exportTableToCSV.call(this, $('.tableWrapper>table'), 'export.csv');

        });


        for (var j = 0; j < headerLabels.length; j++) {
            // console.log(j)
            tableHeader = tableRow.append("td").html(headerLabels[j])
        }
        csvData.forEach(function(csvvalue, i) {

            // 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



            const searchTerm = csvvalue.Label + "," + csvvalue.Definition
            const searchedWord = csvvalue.Label
                // console.log(searchTerm)
            var myHeaders = new Headers();
            myHeaders.append("Authorization", "Bearer " + gptKey);

            var requestOptions = {
                method: 'GET',
                headers: myHeaders,
                redirect: 'follow'
            };





            Promise.all([
                    fetch(endpoint + "/suggest/area-of-law?text=" + searchTerm + "&num_results=" + areaOfLawValue, requestOptions),
                    fetch(endpoint + "/suggest/service?text=" + searchTerm + "&num_results=" + serviceValue, requestOptions),
                    fetch(endpoint + "/suggest/actor-player?text=" + searchTerm + "&num_results=" + actorPlayerValue, requestOptions),
                    fetch(endpoint + "/suggest/standards-compatibility?text=" + searchTerm + "&num_results=" + standardsCompatibilityValue, requestOptions),
                    fetch(endpoint + "/suggest/document-artifact?text=" + searchTerm + "&num_results=" + documentArtifcatValue, requestOptions)
                    // fetch("data/areaOfLaw.json"),
                    // fetch("data/service.json"),
                    // fetch("data/actor.json")
                ])
                .then(resp => Promise.all(resp.map(r => r.text())))
                .then(function(data) {
                    downloadTemplate.remove()

                    var d = JSON.parse(data[0])
                    var service = JSON.parse(data[1])
                    var actor = JSON.parse(data[2])
                    var standards = JSON.parse(data[3])
                    var contracts = JSON.parse(data[4])

                    areaOfLaws = d.suggestions
                    Object.keys(areaOfLaws).map(function(key, index) {
                        var areaOfLaw = areaOfLaws[key]
                        areaOfLaw["classification"] = "Area of Law"
                    })

                    // console.log(areaOfLaws)

                    services = service.suggestions
                    Object.keys(services).map(function(key, index) {
                            var service = services[key]
                            service["classification"] = "Service"
                        })
                        // console.log(areaOfLaws, services)

                    actors = actor.suggestions
                    Object.keys(actors).map(function(key, index) {
                        var actor = actors[key]
                        actor["classification"] = "Actor / Player"
                    })

                    standards = standards.suggestions
                    Object.keys(standards).map(function(key, index) {
                        var standard = standards[key]
                        standard["classification"] = "Standards Compatibility"
                    })


                    contracts = contracts.suggestions
                    Object.keys(contracts).map(function(key, index) {
                        var contract = contracts[key]
                        contract["classification"] = "Document / Artifact"
                    })






                    var data = areaOfLaws.concat(services, actors, standards, contracts);

                    data.forEach(function(d) {
                        searchLabel = csvvalue.Label
                        shortMatch = searchLabel.substring(0, searchLabel.lastIndexOf(" "))
                        console.log(shortMatch)
                        if (d.label.indexOf(csvvalue.Label) > -1) {
                            d.score = d.score + .55
                        }
                        // else if (d.label.indexOf(csvvalue.Label) > -1 != true && d.label.indexOf(shortMatch) > -1){
                        //     d.score = d.score + .45
                        // }

                    })

                    lmss(data)
                        // setTimeout(lmss, 1000, data)

                    console.log(data)
                        // topPrediction = d[0]

                    // console.log(data)
                    function lmss(data) {
                        suggestions = suggestionContainer.append("div").classed("suggestions", true)
                        searchWord = suggestions.append("div").classed("submission", true).html(csvvalue.Label)
                        suggestion = suggestions.selectAll("body").data(data).enter().append("div").classed("UniqueSuggestion", true).attr("id", (d, i) => "rank" + (i + 1))

                        selection = suggestion.append("div").classed("selection", true)
                        selection.append("input").attr("type", "checkbox").attr("id", (d, i) => i + d.iri.replace('http://lmss.sali.org/', "")).on("click", function(d, i) {
                            var checkedGroup = $(this).parent().parent().parent().find(".submission").text()

                            match = d3.select("tbody").append("tr")
                            match.append("td").html(csvvalue.Label)
                            match.append("td").html(csvvalue.Definition)
                            match.append("td").html(i.classification)
                            match.append("td").html(i.label + "</td>")
                            match.append("td").html(i.definitions + "</td>")
                            match.append("td").append("a").html(i.iri.replace('http://lmss.sali.org/', ""))
                            match.append("td").html(i.source)
                            match.append("td").html(function(i) {
                                if (i.score > 1) {
                                    return 1
                                } else {
                                    i.score.toFixed(2)

                                }
                            })
                        })
                        details = suggestion.append("div").classed("details", true)

                        details.append("div").classed("label", true).html(d => "<sup>" + d.classification + "</sup>" + d.label).attr("id", (d, i) => i + d.iri.replace('http://lmss.sali.org/', "")).append("div").html(function(d) {
                            if (d.score > 1) {
                                return (1).toFixed(2)
                            } else {
                                return d.score.toFixed(2)
                            }
                        }).attr("id", function(d, i) {
                            // console.log(d)
                            if (d.score.toFixed(2) >= 0.85) {
                                var link = document.getElementById(i + d.iri.replace('http://lmss.sali.org/', ""));
                                link.click();
                                return "high"
                            } else if (d.score >= 0.8) {
                                return "high"
                            } else if (d.score < 0.8 && d.score >= 0.6) {
                                return "mid"
                            } else {
                                return "low"
                            }
                        })

                        details.append("div").classed("description", true).html(d => d.definitions[0])

                        var selectedChoices = $('.suggestions').find('input:checked').parent().parent().parent()
                        selectedChoices.appendTo('.suggestionContainer')


                    }
                })

            .catch(error =>
                console.log('error', error)
            );

        })

    };
    reader.readAsText(e.target.files.item(0));
}