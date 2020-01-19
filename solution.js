var nf = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');

const BASEURL = 'https://www.bankmega.com';
const url = BASEURL + '/promolainnya.php';
var allPromos = {};

// helper function to get details from detail page link in every promo
function searchPromoDetail(linkToDetailPage) {
    return nf(`${linkToDetailPage}`)
        .then(response => response.text())
        .then(body => {
            const details = {};
            const $ = cheerio.load(body);
            $('#contentpromolain2').each(function(i, element) {
                var $element = $(element);
                var $area = $element.find('.area b').text();
                var $periode = $element.find('.periode b').text();
                var $fullPoster = $element.find('.keteranganinside img').attr('src');
                details.area = $area;
                details.periode = $periode;
                details.fullPoster = BASEURL + $fullPoster;
            });
            return details;
        });
}

// function to scrape the promo from the main page and pagination pages using recursive
function selectPromoLainnya(subcat, page, allPromos) {
    return nf(`${url}` + '?product=0&subcat=' + subcat.toString() + '&page=' + page.toString()).then(response => response.text()).then(body => {
        var category = "";
        var promos = [];
        const $ = cheerio.load(body);
        var $tag = $('#promolain.clearfix li a')
        if ($tag.length > 0) {
            $tag.each(function(i, element) {
                var $element = $(element);
                var $image = $element.find('img');
                var $title = $image.attr('title');
                var $imageSource = BASEURL + "/" + $image.attr('src');
                var $linkToDetailPage = BASEURL + "/" + $element.attr('href');
                searchPromoDetail($linkToDetailPage).then(details => {
                    var promo = {
                        title: $title,
                        small_image_link: $imageSource,
                        detail_link: $linkToDetailPage,
                        promo_area: details.area,
                        promo_period: details.periode,
                        full_poster_image_link: details.fullPoster
                    };
                    promos.push(promo);
                });
            });
            $('#subcatselected').each(function(i, element) {
                var $element = $(element);
                $selected = $element.find('img');
                category = $selected.attr('title');
            });
            if (category in allPromos) {
                index = 0;
                while (index < promos.length) {
                    allPromos[category].push(promos[index]);
                    index++;
                }
            } else {
                allPromos[category] = promos;
            }
            selectPromoLainnya(subcat, page + 1, allPromos)
        } else {
            if ($('.page_promo_lain').length > 0) {
                selectPromoLainnya(subcat + 1, 1, allPromos)
            } else {
                fs.writeFile("solution.json", JSON.stringify(allPromos, null, 4), function(err) {
                    if (err) {
                        return console.log(err);
                    }
                    console.log("The file was saved!");
                });
            }
        }
    })
}

// main
console.log("Writing file ...")
selectPromoLainnya(1, 1, allPromos);