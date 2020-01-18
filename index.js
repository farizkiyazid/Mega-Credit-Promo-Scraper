var fetch = require('node-fetch');
var cheerio = require('cheerio');
var fs = require('fs');

var BASEURL = 'https://www.bankmega.com';
var url = BASEURL + '/promolainnya.php';
var allPromos = [];
var out = "";

function searchPromoDetail(searchTerm) {
    return fetch(`${url}${searchTerm}`).then(response => response.text())
}

function selectPromoLainnya(subcat, page, allPromos) {
    fetch(`${url}` + '?product=0&subcat=' + subcat.toString() + '&page=' + page.toString()).then(response => response.text()).then(body => {
        var category = "";
        var promos = [];
        var $ = cheerio.load(body);
        var $tag = $('#promolain.clearfix li a')
        if ($tag.length > 0) {
            $tag.each(function(i, element) {
                var $element = $(element);
                var $image = $element.find('img');
                var $title = $image.attr('title');
                var $imageSource = BASEURL + "/" + $image.attr('src');
                var $linkToDetailPage = BASEURL + "/" + $element.attr('href');
                var promo = {
                    title: $title,
                    image: $imageSource,
                    link: $linkToDetailPage
                };
                promos.push(promo);
            });
            $('#subcatselected').each(function(i, element) {
                var $element = $(element);
                $selected = $element.find('img');
                category = $selected.attr('title');
            });

            var exists = allPromos.filter(function(o) {
                return o.hasOwnProperty(category);
            }).length > 0;
            if (exists) {
                index = 0;
                while (index < promos.length) {
                    allPromos[subcat - 1][category].push(promos[index]);
                    index++;
                }

            } else {
                var tmp = {}
                tmp[category] = promos;
                allPromos.push(tmp)
            }

            selectPromoLainnya(subcat, page + 1, allPromos)
        } else {
            if ($('.page_promo_lain').length > 0) {
                selectPromoLainnya(subcat + 1, 1, allPromos)
            } else {
                out = out + JSON.stringify(allPromos);
                fs.writeFile("test", out, function(err) {
                    if (err) {
                        return console.log(err);
                    }
                    console.log("The file was saved!");
                });
            }
        }
    })
}

selectPromoLainnya(1, 1, allPromos);