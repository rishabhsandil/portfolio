/**
 *
 *  slider.js v1.4
 *  copyright 2016 xprojs.com
 *
 **/

var XPRO={
    getUnit: function (val, def) {
        var re = /([-]*\d*\.?\d*)(.*)/;
        var tmp = val.match(re);
        if(tmp) return tmp[2];
        return def||"px";
    },
    getIEVersion: function() {
        if(document.all && !document.compatMode) return 5;
        if(document.all && !window.XMLHttpRequest) return 6;
        if(document.all && !document.querySelector) return 7;
        if(window.attachEvent && !window.addEventListener) return 8;
        if(document.all && !window.atob) return 9;
        return 999;
    },
    copyOptions: function(s, o) {
        for(var it in o) { s[it] = o[it]; }
        return s;
    },

    /**
     * Create video url.
     * Param: opt {url, attrs: [{videoUrl, videoType}]}
     * Return object {"url", "videoId"}. If not match youtube/vimeo, return 'html5' in videoId
     **/
    createVideoProperties: function(opt) {

        var url = opt.url;
        var attrs = opt.attrs;

        var videoId="";
        if(url.match(/vimeo.com/i)) {
            //vimeo
            videoId = url.replace(/^.*(vimeo\.com\/)((channels\/[A-z]+\/)|(groups\/[A-z]+\/videos\/)|(video\/))?([0-9]+)\/?/i, "$6");
            url = "//player.vimeo.com/video/" + videoId;
        } else if(url.match(/youtu\.be/gi) || url.match(/youtube/gi)) {
            //youtube
            if (url.match(/youtu\.be/gi)) {
                videoId=url.replace(/^.*(youtu\.be\/)/gi, "");
            } else {
                videoId = url.replace(/^.*((v\/)|(embed\/)|(watch\?))\??v?=?([^\&\?]*).*/i, "$5");
            }
            url = "//www.youtube.com/embed/"+videoId;
        } else {
            //html5
            videoId = 'html5';
        }

        var vidstring = "";
        if(videoId=='html5') {
            var vurl, tpy;
            vidstring += "<video autoplay='autoplay' controls='controls' style='width:100%;height:100%'>";
            jQuery(attrs).each(function(idx, prop) {
                vidstring += "<source src='"+prop.videoUrl+"' type='"+ prop.videoType+"' />";
            });
            vidstring += "</video>";
        } else {
            vidstring += "<iframe style='width:100%;height:100%;display:block;' src='"+url+"?autoplay=1' frameborder='0' allowfullscreen></iframe>";
        }

        return {"url": url, "videoId": videoId, "videoHTML": vidstring};
    }

};

XPRO.Controls={};

XPRO.Controls.Slider=function(id) {

    var me=this;
    var SLIDERANIM = XPRO.Controls.Slider.Anim;

    /**
     * Options
     * mode                     : slide, slideOut, news, carousel, custom
     * loopcontent              : loop content
     * dir                      : left, right, up, down
     * interval                 : interval between slide in ms
     * duration                 : "1s",
     * easing                   : "ease",
     * iniWidth                 : initial slider width
     * iniHeight                : initial slider height
     * autoHeightMode           : fitcontent (adjust height to fit content
     *                            maintainratio (adjust height to ratio)
     *                            fixed (fixed height)
     * thumbnails               : {"orient":"V/H", "sliderThumbSpaces": "10",
     *                              navigation:true/false,  thumb_type: bullet/html,
     *                              location: top/bottom/left/right/external element id,
     *                              switchThumbOrientOnWidth, slideOnHover: false}
     * enableDrag               : enable click and drag to slide
     * enableTouch              : enable swap on touch devices
     * enableKey                : enable keboard navigation
     * stopOnHover              : true/false
     * infoPanel                : "internal" or id of external element.
     * floating                 : false/true, default false
     * autoRun                  : true/false,
     * imageFit                 : //1 render as is, 2 fit, 3 fit width, 4 fit height
     * imageVAlign              : top/center/bottom
     * onAdjustHeight"          : fire when slider automatically adjust its height. Available if responsive=maintainratio
     * switchOrientOnWidth      : null,
     * showPauseButton          : true
     * enableScaleUp            : true
     * showProgress             : false
     * animatedLayerMinIE       : 9
     * kenburnsScale            : 1.3
     */
    this.opt={
        "mode"                  : "slide",
        "loopcontent"           : true,
        "dir"                   : "left",
        "interval"              : 6000,
        "duration"              : "1s",
        "easing"                : "ease-in-out",
        "iniWidth"              : 500,
        "iniHeight"             : 300,
        "minHeight"             : 50,
        "autoHeightMode"        : "maintainratio",
        "enableDrag"            : true,
        "enableTouch"           : true,
        "enableKey"             : true,
        "enableNavigation"      : true,
        "stopOnHover"           : false,
        "thumbnails"            : null,
        "onSlide"               : null,
        "onItemClick"           : null,
        "onAdjustHeight"        : null,
        "infoPanel"             : "",
        "floating"              : false,
        "autoRun"               : false,
        "imageFit"              : 3, //1 render as is, 2 fit, 3 fit width, 4 fit height
        "imageVAlign"           : "center", //1 top, 2 center, 3 bottom
        "switchOrientOnWidth"   : null,
        "showPauseButton"       : true,
        "enableScaleUp"         : false,
        "animatedLayerMinIE"    : 9,
        "showProgress"          : false,
        "kenburnsScale"         : 1.3,
        "scaleFromComputedStyle": false,
        "floatThumb"            : false,
        "newsPreferredWidth"     : null
    };

    this.rt={idx:0, disable:false, "tm": null, paused: false, page_items: 1};
    if(id) {
        this.rt["scroller"] = jQuery("#"+id).get(0);
        jQuery(this.rt["scroller"]).data("xproslider", this);
    };

    /**
     * Arry of content object.
     * Object {
     *      elm : element
     *      nx  : next content
     *      pv  : previous content
     * }
     */
    this.content=[];

    //thumbnail object
    //this.thumbnails=null;

    this.copyOptions = function(s, o) {
        for(var it in o) { s[it] = o[it]; }
        return s;
    };

    this.showLoadOverlay = function() {
        var s = this.rt["scroller"];
        if(jQuery(s).find(".xpro-slider-loading-overlay").length === 0) {
            //show overlay.
            jQuery(s).append("<div class='xpro-slider-loading-overlay'></div>");
        }
    };

    this.hideLoadOverlay = function() {
        var s = this.rt["scroller"];
        jQuery(s).find(".xpro-slider-loading-overlay").remove();
    };

    this.loadRSSProxy = function(proxy, urls, callback) {

        var rss_urls = urls.split("\n");

        jQuery.ajax({
            method:"post",
            url: proxy,
            dataType: 'json',
            data:{q: rss_urls}
        }).done(function(data) {
            callback(data);
        }).fail(function(jqXHR, textStatus) {
            alert(textStatus);
        });
    };

    /**
     * createOpt {
     *      elements: Required, array of images or other elements as slider item
     *      sliderOptions: Required, slider options object
     *      itemHTML: Optional, item filter, generated markup will be passed to this filter. This function must return markup for item
     *      beforeHTML: Optional, markups before slider, rendered inside container
     *      afterHTML: Optional, markups after slider, rendered inside container
     *      placeholder: where slider rendered
     *      rssProxyUrl: RSS proxy URL - if not load from RSS, you can speciy any url that return content.
     *      rssUrl: RSS url
     * }
    */
    this.createSliderStruct = function(createOpt) {

        var dv = document.createElement("div");
        dv.className = "xpro-slider-content";

        var html = "";
        jQuery(createOpt.elements).each(function(idx, elm) {

            if(createOpt.itemHTML) {
                html = createOpt.itemHTML(html, idx, elm);
            }

            jQuery(dv).append(html);

        });

        //jQuery(dv).append("<div class='xpro-slider-item'></div>");

        var sl = document.createElement("div");
        sl.id = "slider"+(new Date()).getTime();
        sl.className = "xpro-slider";
        sl.appendChild(dv);

        var afterHTML = "", beforeHTML="";
        if(createOpt.afterHTML) {afterHTML = createOpt.afterHTML();}
        if(createOpt.beforeHTML) {beforeHTML = createOpt.beforeHTML();}

        var container = document.body;
        if(createOpt.placeholder && createOpt.placeholder!="") container = jQuery("#"+createOpt.placeholder);
        jQuery("<div class='xpro-slider-container'></div>").appendTo(container)
                .append(beforeHTML)
                .append(sl)
                .append(afterHTML);

        if(createOpt.sliderOptions) me.initSlider(sl.id, createOpt.sliderOptions);

        if(createOpt.rssUrl) {
            me.showLoadOverlay();
            me.loadRSSProxy(createOpt.rssProxyUrl, createOpt.rssUrl, function(rssData) {

                me.emptyContent();

                //parse the rss.
                jQuery(rssData).each(function(idx, it) {
                    if(createOpt.itemHTML) {
                        var html = "";
                        html = createOpt.itemHTML(html, idx, it);
                        me.addContentItem(html);
                    } else {
                        me.addContentItem("<div><a class='xp-rss-title' target='_blank' href='"+it["link"]+"'>"
                                +it["title"]+"</a>"
                                +"<div><a target='_blank' href=\""+it["link"]+"\">more..."
                                + "</a></div>"
                                +"</div>");
                    }
                });

                me.run();

                setTimeout(function() {
                    me.revalidate();
                }, 100);

                me.hideLoadOverlay();
            });
        }


    };

    this.initSlider = function(id, opt) {

        if(!id) id = jQuery(this.rt["scroller"]).prop("id");

        if(!opt) opt = this.opt; else this.copyOptions(this.opt, opt);

        this.rt["orient"] = (this.opt["dir"]=="left" || this.opt["dir"]=="right") ? "H" : "V";

        SLIDERANIM.duration = this.opt.duration;
        SLIDERANIM.easing = this.opt.easing;

        var s = jQuery("#"+id).get(0);
        var container = jQuery(s).parent(".xpro-slider-container").get(0);

        if(this.opt["floating"]==true) {
            jQuery(s).parent(".xpro-slider-container").hide()
                .addClass("xpro-floating-slider")
        }

        this.rt["width"] = jQuery(s).width();
        this.rt["height"] = jQuery(s).height();

        if(this.opt["mode"]=="carousel") {
            jQuery(s.parentNode).addClass("xpro-carousel");
        }

        if(this.rt["orient"]=="V") {
            jQuery(s).addClass("xpro-vertical-slider");
        }

        this.rt["scroller"] = s;

        //enable drag
        if(this.opt.enableDrag) {
            XPRO.Controls.DnDSession.addDragNDrop(s, {
                onInitiate : function(ddevent) {me.rt["activateItemClick"]=true;},
                onDragStart : function(ddevent) { $_slideDragStart(ddevent); },
                onDrag : function(ddevent) { $_slideDrag(ddevent); },
                onDrop : function(ddevent) { $_slideDrop(ddevent); }
            });
        }

        //enable touch
        if(this.opt.enableTouch) {
            XPRO.Controls.DnDSession.addTouchDragNDrop(s, {
                onDragStart : function(ddevent) { $_slideDragStart(ddevent); },
                onDrag : function(ddevent) { $_slideDrag(ddevent); },
                onDrop : function(ddevent) { $_slideDrop(ddevent); }
            });
        }

        //enable key
        if(this.opt.enableKey) {
            jQuery(document).on("keydown.xproslider", s, function(e) {
                switch(e.keyCode) {
                    case 37: me.backward(); break;
                    case 39: me.forward(); break;
                    case 32:
                        if(me.opt.autoRun===true) {
                            if(me.rt["tm"]==null) {
                                me.play();
                            } else {
                                me.pause();
                            }
                        }
                        break;
                }
            });
        }

        jQuery(s).find("div.xpro-slider-item").each(
            function(index, elm) {
                jQuery(elm).attr("id", id+"_"+index)
                    .css("z-index", 1000-index)
                    .bind("click", function(event) {
                         if(me.rt["activateItemClick"]==true) {
                            if(me.opt.onItemClick) { me.opt.onItemClick(index);}
                         }
                    });

                if(me.opt["autoHeightMode"]=="fitcontent") {
                    jQuery(elm).height("auto");
                } else {
                    if(me.opt["mode"]=="news" && me.rt["orient"]=="V") {
                        jQuery(elm).height("auto");
                    } else {
                        jQuery(elm).height(me.opt["iniHeight"]);
                    }
                }

                me.content.push({"elm":elm, idx: index});
            }
        );

        //make content circular reference.
        for(var i=0; i<this.content.length; i++) {
            this.content[i].nx = (i>=this.content.length-1) ? this.content[0] : this.content[i+1];
            this.content[i].pv = (i>0) ? this.content[i-1] : this.content[this.content.length-1];
        }

        if(!this.opt.floating && !this.isEmpty()) $_loadImage();

        //navigation
        if(this.opt.enableNavigation==true) {
            $_createNavigation();
        }

        //create float thumb
        if(this.opt.floatThumb) {
            this.generateFloatThumbs();
        }

        this.switchThumbnailsOrient();
        this.switchOrient();

        //set thumbnails
        if(this.opt.thumbnails) {
            this.generateThumbnails();
            this.hightlightThumb(this.rt.idx);
        }

        if(this.opt.infoPanel!="") {
            this.generateInfoPanel();
            this.showInfo(this.content[this.rt.idx]);
        }

        if(this.opt.showPauseButton && this.opt.autoRun) {
            $_generatePauseButton();
        }

        this.generateLinkPreview();

        this.scaleElement(container);
        this.prepareContent(this.opt.mode, this.opt.dir);
        this.revalidate();
        this.initKenburns();
        this.revalidateLayers();

        jQuery(window).resize(function(event) {

            //revalidate and re initialize scroller;
            if(me.opt.onBeforeResize) me.opt.onBeforeResize();

            me.scaleElement(container);
            me.switchThumbnailsOrient();
            me.switchOrient();
            me.prepareContent(me.opt.mode, me.opt.dir);
            me.revalidate();
            me.revalidateLayers();
            if(me.opt["thumbnails"]) {
                setTimeout(function() { me.hightlightThumb(me.rt.idx); }, 200);
            }
            if(me.opt.onAfterResize) me.opt.onAfterResize();

        });

        jQuery(s).find("div.xpro-slider-item img").not(".xpro-lazy").each(function(idx, elm) {

            var img = new Image();
            jQuery(img).on("load", function() {
                var cls = jQuery(elm).attr("class") || '';
                if(cls.match(/xpro-kenburns-dir-(\w)+($|\s)/gi)) {
                    elm.src = img.src;
                    setTimeout(function() {
                        me.initKenburns(elm);
                        me.revalidate();
                        me.revalidateLayers();
                    }, 100);
                } else {
                    me.revalidate();
                }
            });
            img.src = jQuery(elm).attr("src");


        });

        //create video play button
        me.generateVideoButton();

        //create progress
        $_addProgress();

        if(this.opt.autoRun==true) {
            jQuery(s).on("mouseover", function() {
                if(me.opt.stopOnHover==true) {
                    if(me.rt["ptm"]!=null) {
                        clearTimeout(me.rt["ptm"]);
                        me.rt["ptm"] = null;
                    }
                    if(me.rt.paused===false) me.pause();
                }
            }).on("mouseout", function() {
                if(me.opt.stopOnHover==true) {
                    if(me.rt["ptm"] == null)
                        me.rt["ptm"] = setTimeout(function() {
                            me.play();
                        }, 300);
                }
            });
            if(this.opt.floating!=true && !this.isEmpty()) this.run();
        }

    };

    this.revalidateLayers = function(elm) {

        if(!elm) {
            for(var i=0; i<this.content.length; i++) {
                var cnt = this.content[i];
                jQuery(cnt.elm).find(".xpro-item-layer, .xpro-item-layer-element, .xpro-item-layer-responsive").each(function(idx, elm) {
                    me.scaleElement(elm);
                });
            }
            jQuery(".xpro-sticky-item").find(".xpro-item-layer-element, .xpro-item-layer-responsive").each(function(idx, elm) {
                me.scaleElement(elm);
            });
        } else {
            me.scaleElement(elm);
        }

        this.runLayerAnim(me.rt.idx);
        this.runLayerVideo(me.rt.idx);

    };

    this.scaleElement = function(elm) {
        if(!elm) return;

        if(!jQuery(elm).data("$initialprop")) {
            var cssprop =
                ["opacity", "margin-top", "margin-bottom", "margin-left", "margin-right",
                 "padding-top", "padding-bottom", "padding-left", "padding-right",
                 "font-size", "max-width", "max-height", "line-height",
                 "border-top-width", "border-left-width", "border-bottom-width",
                 "border-right-width", "transform"
                ];
            var inlineprop = ["width", "height", "left", "top", "bottom", "right"];
            var prop = {};
            if(me.opt.scaleFromComputedStyle) {
                prop = jQuery(elm).css(cssprop);
            } else {
                for(var it=0; it<cssprop.length; it++) {
                    prop[cssprop[it]] = elm.style[cssprop[it]];
                }
            }
            for(var it=0; it<inlineprop.length; it++) {
                prop[inlineprop[it]] = elm.style[inlineprop[it]];
            }
            //prop = jQuery(elm).css(cssprop);
            jQuery(elm).data("$initialprop", prop);
        }

        //apply scale
        var scale = me.getScale(), iprop={};
        me.copyOptions(iprop, jQuery(elm).data("$initialprop"));

        /*reset all animation*/
        jQuery(elm).data("$normalprop", null);
        //jQuery(elm).css("transition", "");
        //jQuery(elm).css("transform", "");
        jQuery(elm).css(iprop);
        /*------------------*/

        //if(scale<=1) {
            var unit;
            for(var it in iprop) {
                if(iprop[it]) {
                    unit = XPRO.getUnit(iprop[it]);
                    if(unit == "px" || unit == "pt" || unit == "em") {
                        iprop[it] = (scale*parseFloat(iprop[it])) + unit;
                    }
                }
            }

            jQuery(elm).css(iprop);
        //}

        var animprop = {}, pname = ["opacity", "left", "top", "bottom", "right", "transform", "width", "height"];
        for(var i=0; i<pname.length; i++) {
            animprop[pname[i]] = iprop[pname[i]];
        }
        jQuery(elm).data("$normalprop", animprop);

    };

    this.getScale = function() {

        var s = this.rt["scroller"].parentNode; //get contaier
        var scale = jQuery(s).outerWidth()/this.opt.iniWidth; //use outerwidth (including padding/margin).
        if(this.opt.enableScaleUp===false) {
            scale = Math.min(scale, 1);
        }
        return scale;
        //return Math.min(scale, 1);
    };

    this.addContentItem = function(html, cb) {

        var s = this.rt["scroller"],
            ihtml = "<div class=\"xpro-slider-item\">" +  html + "</div>";

        if(jQuery(html).hasClass("xpro-slider-item")) {
            ihtml = html;
        }

        if(s) {
            var index = this.content.length;

            var elm = jQuery(ihtml).attr("id", s.id+"_"+index)
                    .css("z-index", 1000-index)
                    .bind("click", function(event) {
                         if(me.rt["activateItemClick"]==true) {
                            if(me.opt.onItemClick) { me.opt.onItemClick(index);}
                         }
                    });

            var cnt = {"elm":jQuery(elm).get(0), idx: index, pv:null, nx:null};

            if(!this.isEmpty()) {
                var last = this.content[this.content.length-1];
                var first= this.content[0];
                cnt.pv = last; cnt.nx = first;
                last.nx = cnt; first.pv = cnt;
            }

            me.content.push(cnt);

            jQuery(elm).css('opacity', 0).appendTo(jQuery(s).find(".xpro-slider-content"));

            //create thumb
            me.generateThumbnails(cnt);

            //create info panel
            me.generateInfoPanel(cnt);

            //create video button
            me.generateVideoButton(cnt);

            me.generateLinkPreview(cnt);

            if(me.opt["autoHeightMode"]=="fitcontent") {
                jQuery(elm).height("auto");
            } else {
                if(me.opt["mode"]=="news") {
                    jQuery(elm).height("auto");
                } else {
                    jQuery(elm).height(me.opt["iniHeight"]);
                }
            }

            //this.revalidate();
            setTimeout(function() {
                me.prepareContent(me.opt.mode, me.opt.dir);
                jQuery(elm).css('opacity', 1);
                if(cb) cb(cnt);
            }, 10);
        }

    };

    this.deleteContentItem = function(idx) {

        this.stopSlider();

        var cnt = this.content[idx];
        if(cnt) {

            jQuery(cnt['thm']).detach(); //detach thumb
            jQuery(cnt['info']).detach(); //detach info panel

            var pv = cnt.pv, nx = cnt.nx;
            if(pv.idx!=nx.idx) {
                pv.nx = nx;
                nx.pv = pv;
            }

            this.content.splice(idx, 1);

            //update index.
            for(var it = 0; it<this.content.length; it++) {
                this.content[it].idx = it;
            }

            jQuery(cnt.elm).detach();
        }


    };

    this.emptyContent = function() {

        this.stopSlider();

        this.rt.idx = 0;
        this.content = [];
        jQuery(this.rt["scroller"]).find(".xpro-slider-content").children().each(function() {
            jQuery(this).detach();
        });
        jQuery(this.rt["scroller"]).next(".xpro-thumbnails").detach();

    };

    this.getContent = function() {
        return this.content;
    };

    this.getContentPanel = function() {
        var s = this.rt["scroller"];
        if(jQuery(s).find(".xpro-slider-content").length==0) {
            return jQuery("<div class='xpro-slider-content'></div>").appendTo(s).get(0);
        }
        return jQuery(s).find(".xpro-slider-content").get(0);
    };

    this.isEmpty = function() {
        return (this.content.length==0);
    };

    function $_slideDragStart(ddevent) {
        if(me.rt.disable) return false;

        me.prepareContent(me.opt.mode, me.opt.dir);

        var css = (me.opt.dir=="left" || me.opt.dir=="right") ? "left" : "top";
        ddevent.startPos = parseInt(me.content[me.rt.idx].elm.style[css], 10);

        me.stopSlider();

        return true;
    };

    function $_slideDrag (ddevent) {
        if(me.rt.disable) return false;

        var crCnt = me.content[me.rt.idx], dt, orient;
        if(me.opt.dir=="left" || me.opt.dir=="right") {
            dt = ddevent.screenX - ddevent.startedAt.x;
            orient = "H";
        } else {
            dt = ddevent.screenY - ddevent.startedAt.y;
            orient = "V";
        }

        switch(me.opt.mode) {
            case "slide":
            case "news":
            case "carousel":
                //crCnt.elm.parentNode.style[css] = ddevent.startPos + dt + "px"; break;
                SLIDERANIM.setPosition(crCnt.elm.parentNode, orient, (ddevent.startPos+dt) + "px"); break;
            case "slideOut":
            case "fade":
            case "custom":
                //crCnt.elm.style[css] = ddevent.startPos + dt + "px"; break;
                var tmp = crCnt;

                var i=2;
                do {
                    if(dt<0) { tmp = tmp.nx; } else {
                        tmp = tmp.pv;
                    }
                    if(tmp.idx!=crCnt.idx) {
                        jQuery(tmp.elm).css("opacity", 1);
                        tmp.elm.style.zIndex = 1000-i;
                        $_setContentPos(tmp, "H", 0);
                        i++;
                    } else break;
                } while(true);

                SLIDERANIM.setPosition(crCnt.elm, orient, (ddevent.startPos+dt) + "px"); break;
        }

        me.rt["activateItemClick"] = false;
        return true;
    };

    function $_slideDrop(ddevent) {
        if(me.rt.disable) return false;

        var dr = "";
        if(me.opt.dir=="left" || me.opt.dir=="right") {
            dr = (ddevent.screenX-ddevent.startedAt.x) > 0 ? "right" : "left";
        } else {
            dr = (ddevent.screenY-ddevent.startedAt.y) > 0 ? "down" : "up";
        }
        var m = (me.opt.mode=="slideOut"
                || me.opt.mode=="fade"
                || me.opt.mode=="custom") ? "slideOut": null;

        var cndir = (dr=='right' || dr=='down') ? 'prev' : 'next';
        $_runSlide(dr, {duration:'0.3s', mode:m, dir:dr, cntdir:cndir });

        me.timerReset();
        setTimeout(function() {
            if(me.opt.autoRun==true) me.run();
        }, me.opt.interval );

        return true;
    };

    function $_runSlide(dr, opt) {
        setTimeout(
            function() {
                me.runSlideCss(dr, opt);
            },
            10 //required for FF and IE WTF
        );
    };

    function $_createNavigation() {
        var html = "";
        html = "<div class='xpro-slider-nav xpro-slider-nav-next'><span class='xpro-slider-icon'></span></div>\n\
                <div class='xpro-slider-nav xpro-slider-nav-prev'><span class='xpro-slider-icon'></span></div>";

        var s = me.rt["scroller"];
        jQuery(s).append(html);

        jQuery(s).find(".xpro-slider-nav-next, .xpro-slider-nav-prev").on("click", function(event) {

            var totTime = me.runLayerAnim(me.rt.idx, "out");

            if(me.opt.autoRun==true) {
                me.stopSlider();
                if(!me.opt.stopOnHover) setTimeout(function() {
                    me.run();
                }, /*me.opt.interval +*/ totTime );
            }

            me.timerReset();

            var elm = this, pageItems = me.rt["page_items"];

            setTimeout(function() {
                if(jQuery(elm).hasClass("xpro-slider-nav-next")) {
                    me.forward(pageItems);
                } else {
                    me.backward(pageItems);
                }
            }, totTime);

            event.preventDefault();

        })
        .on("mousedown", function(event) {
            event.stopPropagation();
        })
        .on("mouseover", function() {
            jQuery(this).addClass("xpro-slider-nav-hover");
            var css = (jQuery(this).hasClass("xpro-slider-nav-next") ? "next": "prev");
            me.showFloatThumb(me.rt.idx, css);
        })
        .on("mouseout", function() {
            jQuery(this).removeClass("xpro-slider-nav-hover");
            me.hideFloatThumb();
        });

        //mouse move to show navigation;
        jQuery(s).bind("mouseover", function() {
            jQuery(s).find("div.xpro-slider-nav").addClass("xpro-slider-nav-selected");
        });
        jQuery(s).bind("mouseout", function() {
            jQuery(s).find("div.xpro-slider-nav").removeClass("xpro-slider-nav-selected");
        });

    };

    function $_getThumbElement(cnt) {
        if(jQuery(cnt.elm).find(".xpro-thumb-item").length>0) {
            return jQuery(cnt.elm).find(".xpro-thumb-item").get(0);
        } else {
            var thopt= me.opt.thumbnails;
            if(thopt && thopt["thumb_type"]=="bullet") {
                return null;
            } else return cnt.thm;
        }
        return null;
    };

    this.showFloatThumb = function(idx, css) {

        if(!css) {
            var fc = this.rt["float-css"];
            if(!fc || fc=='fixed' || fc=='') {
                return;
            } else css = fc;
        } else {
            this.rt["float-css"] = css;
        }

        var crCnt = this.content[idx], prefix="xpro-float-thumb-";

        var item = $_getThumbElement(crCnt), cls = prefix+css;

        if(item==null) return;

        if(css=="prev") {
            item = $_getThumbElement(crCnt.pv);
        } else if(css=="next") {
            item = $_getThumbElement(crCnt.nx);
        }

        var ft = jQuery(me.rt["scroller"]).find(".xpro-float-thumb"), tm=0;
        if(ft.hasClass(prefix+"selected")) {
            ft.removeClass(prefix+"selected");
            tm = 800;
        }
        setTimeout(function() {
            ft.css("transition", "");
            ft.removeClass(prefix+"next "+prefix+"prev "+prefix+"fixed "+prefix+"selected");
            ft.addClass(cls).html(jQuery(item).html());
            setTimeout(function() {
                if(me.rt["float-css"]=="") return;
                ft.css("transition", "all 0.8s");
                ft.addClass(prefix+"selected");
            }, 100);
        }, tm);
    };

    this.hideFloatThumb = function() {
        jQuery(me.rt["scroller"]).find(".xpro-float-thumb").removeClass("xpro-float-thumb-selected");
        me.rt["float-css"]="";
    };

    this.generateFloatThumbs = function(slideItem) {

        var s = this.rt["scroller"];

        jQuery("<div class='xpro-float-thumb'></div>").appendTo(s);

        if(!slideItem) slideItem = "div.xpro-slider-item";
        jQuery(s).find(slideItem).each(function(idx, elm) {
            if(!me.opt.thumbnails
                    || (me.opt.thumbnails["thumb_type"]=="bullet")) {
                //hide the thumb
                jQuery(elm).find(".xpro-thumb-item").hide();
            }

        });


    };

    /**
     * Generate thumbnails from content.
     */
    this.generateThumbnails = function(cntObj) {
        var opt = this.opt.thumbnails;
        if(!opt) return;

        var s = this.rt["scroller"];
        var orient = (opt && opt.orient)?opt.orient:"H";

        var d = null;
        if(jQuery("#"+me.rt["scroller"].id+"_thumb").length==0) {
            d = document.createElement("div");
            jQuery(d).addClass("xpro-thumbnails")
                .prop("id", me.rt["scroller"].id+"_thumb")
                .append("<div class='xpro-thumb-content'></div>");
            if(orient=="V") jQuery(d).addClass("xpro-vert-thumbnails");

            var loc = opt["location"] ? opt["location"] : "bottom";
            if(loc=="top" || loc=="left") {
                jQuery(s).before(d);
            } else if(loc=="bottom" || loc=="right") {
                jQuery(s).after(d);
            } else {
                jQuery("#"+loc).html(d);
            }

            me.rt["thumbnails"] = d;
        } else {
            d = jQuery("#"+me.rt["scroller"].id+"_thumb").get(0);
        }

        var thm = jQuery(d).children("div.xpro-thumb-content").get(0);

        var theItems = this.content;
        if(cntObj) {
            theItems = cntObj;
        }

        //jQuery(s).find(theItem).each(function(idx, elm) {
        jQuery(theItems).each(function(idx, cntItem) {

            var thethumb = jQuery(cntItem.elm).find(".xpro-thumb-item"), item;

            if(thethumb.length<=0 || opt["thumb_type"]=="bullet") {
                item = document.createElement("div");
                jQuery(item).addClass("xpro-thumb-item")
                    .on("mouseover", function() {
                        me.showFloatThumb(cntItem.idx, "fixed");
                    }).on("mouseout", function() {
                        me.hideFloatThumb();
                    });
            } else {
                item = thethumb.detach().get(0);
            }

            cntItem.thm = item;

            var hoverSlide = "";
            if(opt["slideOnHover"]===true) hoverSlide = " mouseover";

            jQuery(item).on("click"+hoverSlide, function(event) {
                var s = XPRO.Controls.Slideable.slideables[d.id];
                if(s && !s.rt["ondrag"]) {
                    me.slideTo(cntItem.idx);
                    setTimeout(function() {
                        if(me.opt.autoRun==true) me.run();
                    }, 0 );
                }
            });
            jQuery(thm).append(item);
        });

        //add slideable
        XPRO.Controls.Slideable.slideable(d.id, opt);


    };

    /**
     * Generate info panel
     */
    this.generateInfoPanel = function(cntObj) {

        var opt = me.opt["infoPanel"];
        if(!opt) return;

        var s = me.rt["scroller"];

        if(!cntObj) cntObj = this.content;

        jQuery(cntObj).each(function(idx, cntItem) {

            var info = jQuery(cntItem.elm).find("div.xpro-slider-info"), infoelm;
            if(info.length>0) {
                infoelm = info.detach().get(0);
            } else {
                infoelm = document.createElement("div");
            }

            cntItem.info = jQuery(infoelm).html();

            //me.content[idx].info = infoelm;

            //jQuery("#"+opt.panelId).append(infoelm);

        });

    };

    /**
     * Generate video button.
     **/
    this.generateVideoButton = function(cntObj) {
        var s = me.rt["scroller"];
        jQuery(!cntObj?s:cntObj.elm).find(".xpro-video-item").each(function(idx, elm) {

            //hide propery if exists
            jQuery(elm).find(".xpro-video-prop").hide();

            if(jQuery(elm).find(".xpro-video-tools").length==0) {
                jQuery(this).append("<div class='xpro-video-tools xpro-slider-css-animate'><a class='xpro-video-play xpro-slider-css-animate'><span class='xpro-slider-icon'></span></a></div>");

                var title = elm.getAttribute("data-title");
                if(title) {
                    jQuery(this).find(".xpro-video-play").after("<div class='xpro-video-title xpro-slider-css-animate'>"+title+"</div>");
                }
            }

            jQuery(this).find(".xpro-video-play").on("click", function() {
                //show video
                if(me.rt["activateItemClick"]) {
                    var vopt = {"elm": elm, "lightbox":false};
                    me.createVideo(vopt, function() {});
                    me.stopSlider();
                    me.timerReset();
                    me.disable();
                }
            });

        });
    };

    this.generateLinkPreview = function(cntObj) {
        var s = me.rt["scroller"];
        jQuery(!cntObj?s:cntObj.elm).find("a").each(function(idx, elm) {

            if(jQuery(elm).attr("data-display") == "lightbox") {

                jQuery(elm).on("click", function() {

                    if(!me.rt["activateItemClick"]) return false;

                    var url = jQuery(this).attr("href");
                    var type = jQuery(this).attr("data-display-type");
                    if(!type) type = "iframe";
                    var pbox = new XPRO.Controls.PreviewBox();
                    pbox.show({"url": url, "type":type});
                    return false;

                });

            }
        });
    };

    function $_generatePauseButton() {

        var s = me.rt["scroller"];

        var d = document.createElement("div");
        jQuery(d).addClass("xpro-slider-pause").html("<span class='xpro-slider-icon'></span>");
        jQuery(s).append(d);

    };

    this.initKenburns = function(elm) {

        if(XPRO.getIEVersion() < 10) {
            return false;
        }

        var kbDef = {
            "xpro-kenburns-dir-topleft": [-1, -1],
            "xpro-kenburns-dir-topright": [1, -1],
            "xpro-kenburns-dir-bottomleft": [-1, 1],
            "xpro-kenburns-dir-bottomright": [1, 1],
            "xpro-kenburns-dir-top": [0, -1],
            "xpro-kenburns-dir-left": [-1, 0],
            "xpro-kenburns-dir-right": [1, 0],
            "xpro-kenburns-dir-bottom": [0, 1],
            "xpro-kenburns-dir-center": [0, 0]
        },
        scale = me.opt.kenburnsScale,
        dimScale = me.getScale();

        var s = me.rt["scroller"];

        //get all except images
        if(!elm) elm = jQuery(s).find(".xpro-slider-item").find('[class*="xpro-kenburns-dir-"]').not('img');

        jQuery(elm).each(function(idx, ken) {

            jQuery(ken).addClass("xpro-item-layer");

            me.centerElement(ken);

            var dx = (jQuery(ken).outerWidth()*(scale-1))/2 - 1, dy=(jQuery(ken).outerHeight()*(scale-1))/2 - 1;

            var scaleddx = dx*dimScale;
            var scaleddy = dy*dimScale;

            var match = jQuery(ken).attr("class").match(/xpro-kenburns-dir-(\w)+($|\s)/gi)[0];
            match = jQuery.trim(match);
            if(match=="xpro-kenburns-dir-random") {
                jQuery(ken).removeClass("xpro-kenburns-dir-random");
                var rand = parseInt(Math.random()*9, 10), count=0;
                for(var it in kbDef) {
                    if(count>=rand) { match = it; break; }
                    count++;
                }
                jQuery(ken).addClass(match);
            }

            var kb = kbDef[match];
            var arr = ["duration:'"+(me.opt.interval/1000 + 3)+"s'", "delay:'0.1s'"];
            var io = 1;

            if(jQuery(ken).hasClass("xpro-kenburns-in")) {
                jQuery(ken).css("transform", "translateX("+(scaleddx*kb[0]*-1)+"px) translateY("+(scaleddy*kb[1]*-1)+"px) scale("+scale+")");
                arr.push("scale:1");
                io = 0;
            } else {
                arr.push("scale:"+scale);
            }

            arr.push("X:'"+(kb[0]*dx*io)+"px'");
            arr.push("Y:'"+(kb[1]*dy*io)+"px'");

            jQuery(ken).attr("data-effect", "kenBurns({"+ arr.join(",") +"})");

            jQuery(ken).off().on("transitionend", function(event) {
                me.reverseKenburns(ken);
            });

        });

    };

    this.reverseKenburns = function(ken, startAnim) {

        var revKB = {
            "xpro-kenburns-dir-topleft": "xpro-kenburns-dir-bottomright",
            "xpro-kenburns-dir-topright": "xpro-kenburns-dir-bottomleft",
            "xpro-kenburns-dir-bottomleft": "xpro-kenburns-dir-topright",
            "xpro-kenburns-dir-bottomright": "xpro-kenburns-dir-topleft",
            "xpro-kenburns-dir-top": "xpro-kenburns-dir-bottom",
            "xpro-kenburns-dir-left": "xpro-kenburns-dir-right",
            "xpro-kenburns-dir-right": "xpro-kenburns-dir-left",
            "xpro-kenburns-dir-bottom": "xpro-kenburns-dir-top",
            "xpro-kenburns-dir-center": "xpro-kenburns-dir-center"
        };

        //get current kb
        var match = jQuery(ken).attr("class").match(/xpro-kenburns-dir-(\w)+($|\s)/gi)[0];
        var rev = revKB[jQuery.trim(match)];
        jQuery(ken).removeClass(match).addClass(rev).addClass('xpro-kenburns-reverse'); //marker

        //reverse kenburns
        if(jQuery(ken).hasClass("xpro-kenburns-in")) {
            jQuery(ken).removeClass("xpro-kenburns-in");
        } else {
            jQuery(ken).addClass("xpro-kenburns-in");
        }
        me.initKenburns(ken);
        if(startAnim!==false)me.runLayerAnim(me.rt.idx, false, ken);
    };

    this.centerElement = function(el) {
        var s = me.rt["scroller"];
        var w = jQuery(s).outerWidth(), h = jQuery(s).outerHeight();
        var iw = jQuery(el).outerWidth(), ih = jQuery(el).outerHeight();
        var l = (w-iw)/2, t = (h-ih)/2;
        jQuery(el).css("top", t + "px").css("left", l + "px");
        return [l,t];
    };

    this.createVideo = function(vopts, closeCB) {

        var elm = vopts.elm;
        var attrs = [], url = elm.getAttribute("data-videourl"),
            disp = elm.getAttribute("data-display");

        jQuery(elm).find(".xpro-video-prop").each(function(idx, prop) {
            attrs.push({videoUrl: prop.getAttribute("data-videourl"),
                videoType:  prop.getAttribute("data-videotype")});
        });

        if((vopts["lightbox"] && vopts["lightbox"]==true) || disp=='lightbox') {
            var pbox = new XPRO.Controls.PreviewBox();
            pbox.show({"url": url, "type":"video", "attrs": attrs, "closeCallback":function() {
                me.enable();
                if(me.opt.autoRun==true) me.run();
            }});
            return;
        }

        var vdata = XPRO.createVideoProperties({"url": url, "attrs": attrs});

        var h = jQuery(elm).height();

        var d = document.createElement("DIV");
        d.className="xpro-video-frame";
        jQuery(d).width(jQuery(elm).width()).height(h);

        jQuery(d).html(vdata.videoHTML);
        jQuery(d).prepend("<div class='xpro-video-close'><span class='xpro-slider-icon'></span></div>");

        var closeBtn = jQuery(d).find(".xpro-video-close").get(0);

        jQuery(d).bind("mouseover", function() {
            jQuery(closeBtn).addClass("xpro-video-close-hover");
        }).bind("mouseout", function() {
            jQuery(closeBtn).removeClass("xpro-video-close-hover");
        });

        jQuery(elm).after(d).hide();

        jQuery(closeBtn).css("left", (jQuery(d).width()-jQuery(closeBtn).width())/2)
            .bind("click", function() {
                jQuery(d).remove();
                jQuery(elm).show();
                if(closeCB)closeCB();
                me.enable();
                if(me.opt.autoRun==true) me.run();
            });

        var s = me.rt["scroller"];
        jQuery(s).on("revalidate", function() {

            var h = jQuery(elm).parent(".xpro-slider-item").height();
            if(me.opt.autoHeightMode=="fitcontent") {
                h = jQuery(elm).height();
            }

            jQuery(d).width(jQuery(elm).width()).height(h);
            jQuery(closeBtn).css("left", (jQuery(d).width()-jQuery(closeBtn).width())/2);

        });
    };

    function $_loadAnImage(img, cb) {
        var src = img.getAttribute("data-src");
        if(!src || src=="" || src=="loaded") return;

        var nimg = new Image();
        nimg.onload = function() {
            img.setAttribute("data-src", "loaded");
            img.src = nimg.src;
            var cls = jQuery(img).attr("class") || '';
            if(cls.match(/xpro-kenburns-dir-(\w)+($|\s)/gi)) {
                setTimeout(function() { //IE things, wth.....
                    me.initKenburns(img);
                    me.revalidate();
                    me.revalidateLayers(img);
                }, 100);
            } else {
                me.revalidate();
            }
            if(cb) cb(img);
        };
        nimg.src = src;

    };

    function $_loadImagePlaceHolder(ph, cb) {
        var src = ph.getAttribute("data-src");
        if(!src || src=="" || src=="loaded") return;
        var img = new Image();
        img.onload = function() {
            ph.setAttribute("data-src", "loaded");
            jQuery(this).addClass(jQuery(ph).attr("data-class"));
            jQuery(ph).append(img);
            var cls = jQuery(img).attr("class") || '';
            if(cls.match(/xpro-kenburns-dir-(\w)+($|\s)/gi)) {
                me.initKenburns(img);
                me.revalidate();
                me.revalidateLayers(img);
            } else {
                me.revalidate();
            }
            if(cb) cb(ph, img);
        };
        img.src = src;
    };

    function $_loadImage(idx) {
        if(!idx) idx = me.rt.idx;
        var crc = me.content[idx], img, a=[], ph;
        if(me.opt["loopcontent"]) {
            a.push(crc);
            if(crc["nx"])a.push(crc.nx);
            if(crc["pv"])a.push(crc.pv);
        } else {
            a.push(crc);
            if(crc.idx>0) img = a.push(crc.pv);
            if(crc.idx<me.content.length-1) a.push(crc.nx);
        }
        for(var i=0;i<a.length;i++) {
            img = jQuery(a[i].elm).find(".xpro-lazy").each(function(idx, elm) {
                $_loadAnImage(elm);
            });
            jQuery(a[i].elm).find(".xpro-image-placeholder").each(function(idx, elm) {
                $_loadImagePlaceHolder(elm);
            });

        }

    };

    function $_parseEffect(ef) {

        var ret = [];

        if(!ef || ef=="") return ret;

        var aef = ef.split(";"), tmp = "", o = {};
        var re = /([a-zA-Z0-9]*)\(([^\)]*)\)/i;

        for(var i=0; i<aef.length; i++) {
            tmp = aef[i].match(re);
            if(!tmp) {
                ret.push({"fname":ef, "opt": o});
            } else {
                if(tmp.length>1) o = eval("("+tmp[2]+")");
                ret.push({"fname":tmp[1], "opt": o});
            }
        }
        return ret;
    };

    function $_addProgress() {
        var s = me.rt["scroller"];
        jQuery(s).append("<div class='xpro-slider-progress'><div class='xpro-slider-progress-content'></div></div>");
    };

    function $_parseAnimTime(delay, duration) {

        if(!duration) duration = 1000;
        if(!delay) delay = 0;

        delay = delay + "";
        duration = duration + "";

        if(delay.indexOf("ms")>-1) {
            delay = parseFloat(delay);
        } else if(delay.indexOf("s")>-1) {
            delay = parseFloat(delay) * 1000;
        }
        if(duration.indexOf("ms")>-1) {
            duration = parseFloat(duration);
        } else if(duration.indexOf("s")>-1) {
            duration = parseFloat(duration) * 1000;
        }
        return parseFloat(delay)+parseFloat(duration);
    };

    this.switchThumbnailsOrient = function(orient) {

        if(!this.opt.thumbnails) return;

        var s = this.rt["scroller"];

        if(!orient) {
            if(me.opt.thumbnails.switchThumbOrientOnWidth!=null) {
                if(jQuery(s.parentNode).width() < me.opt.thumbnails.switchThumbOrientOnWidth) {
                    orient = "H";
                } else {
                    orient = "V";
                }
            } else return;
        }

        this.opt.thumbnails.orient = orient;
        if(this.rt["thumbnails"]) {
            var slideable = XPRO.Controls.Slideable.slideables[this.rt["thumbnails"].id];
            slideable.opt.orient = orient;
            slideable.resetPosition();
        }

        jQuery(".xpro-thumb-content").hide(); //elimiate the flicker
        if(orient=="H") {
            jQuery(".xpro-thumbnails").removeClass("xpro-vert-thumbnails");
        } else {
            jQuery(".xpro-thumbnails").addClass("xpro-vert-thumbnails");
        }
        setTimeout(function() {jQuery(".xpro-thumb-content").show();}, 50); //show the thumb again.

        //this.revalidate();
    };

    this.switchOrient = function(orient) {

        var s = this.rt["scroller"];

        if(!orient) {
            if(me.opt.switchOrientOnWidth!=null) {
                if(jQuery(s).width()<this.opt.switchOrientOnWidth) {
                    orient = "V";
                } else {
                    orient = "H";
                }
            } else return;
        }

        var odir = this.opt.dir, ndir;

        var curorient = (odir=="left" || odir=="right") ? "H" : "V";
        if(curorient==orient) return;

        if(odir=="left") ndir="up"; else
           if(odir=="right") ndir="down"; else
               if(odir=="up") ndir="left"; else
                   if(odir=="down") ndir="right";

        var norient = (ndir=="left" || ndir=="right") ? "H" : "V";
        var css = "";

        this.rt["orient"] = norient;
        this.opt.dir = ndir;
        this.rt["dir"] = ndir;

        if(norient=="V") {
            jQuery(s).addClass("xpro-vertical-slider");
            css="left";
        } else {
            jQuery(s).removeClass("xpro-vertical-slider");
            css="top";
        }

        for(var i=0;i<this.content.length; i++) {
            jQuery(this.content[i].elm).css(css, "0px");
        }

        this.prepareContent(this.opt.mode, this.opt.dir);

    };

    this.resized = function() {
        this.revalidate();
        this.prepareContent(this.opt.mode, this.opt.dir);
        this.hightlightThumb(0);
        this.hightlightThumb(this.rt.idx);
        this.revalidateLayers();
    };

    this.revalidate = function() {

        var s = this.rt["scroller"];
        var thumbprop = this.opt["thumbnails"];

        if(thumbprop) {
            if(thumbprop["orient"]=="V" && thumbprop["floating"]!=true) {
                var spc = thumbprop.sliderThumbSpaces || 10;
                jQuery(s).width(jQuery(s.parentNode).width()-jQuery(this.rt["thumbnails"]).width()-spc);
            } else {
                jQuery(s).css("width", "");
            }
        }

        if(this.opt["autoHeightMode"]=="fitcontent") {
            if(this.opt["mode"]=="news") {
                //*in news mode, because items shows side by side,
                //the slider height is set to the highest item height*/
                //get max height

                var maxH = 0, h, e;
                for(var i=0; i<this.content.length; i++) {
                    e = this.content[i].elm;
                    jQuery(e).css("height", "auto");
                    //h = jQuery(this.content[i].elm).outerHeight(true);
                    h = jQuery(this.content[i].elm).prop("scrollHeight");
                    jQuery(e).css("height", "100%");
                    if(h>maxH) { maxH = h; }
                }

                jQuery(s).height(maxH);
            } else {
                jQuery(s).height(jQuery(this.content[this.rt.idx].elm).outerHeight(true));
            }
        } if(this.opt["autoHeightMode"]=="maintainratio") {
            if(this.opt.onAdjustHeight==null) {
                jQuery(s).height(Math.max(
                    this.opt["minHeight"],
                    Math.floor(this.opt["iniHeight"]*jQuery(s).width()/this.opt["iniWidth"]))
                );
            } else {
                jQuery(s).height(this.opt.onAdjustHeight(this));
            }
        } else {
            if(jQuery(s).height()==0) {
                jQuery(s).height(this.opt["iniHeight"]);
            }
        }

        //reset height
        this.rt["height"]=jQuery(s).height();

        if(this.opt["autoHeightMode"] != "fitcontent" &&
                (this.opt.mode!="news" || (this.opt.mode=="news" && this.rt["orient"]=="H"))) {
            jQuery(s).find("div.xpro-slider-item").each(
                function(idx, elm) {
                    jQuery(elm).css("height", me.rt["height"]);
                }
            );
        }

        //set thumbnails height
        if(thumbprop) {
            if(thumbprop["orient"]=="V" && thumbprop["floating"]!=true) {
                jQuery(this.rt["thumbnails"]).height(jQuery(s).height());
            } else {
                jQuery(this.rt["thumbnails"]).css("height", "");
            }
        }

        //adjust image size and position
        jQuery(s).find("div.xpro-slider-item img.xpro-slider-image").each(function(idx, elm) {
            //adjust size and position.
            var align = me.opt["imageFit"];

            var w = jQuery(s).width(), h = jQuery(s).height();
            var iw = jQuery(elm).width(), ih = jQuery(elm).height();

            if(align == 2) {//auto fit
                if(h*iw/w > h) {
                    align = 4;
                } else {
                    align = 3;
                }
            }

            if(align == 3) {//fit width
                if(iw>w) {
                    jQuery(elm).css("max-width", "100%").css("height", "auto");
                }
            } else if(align == 4) {//fit height
                if(ih>h) {
                    jQuery(elm).css("max-height", "100%").css("width", "auto");
                }
            }

            //center the image.
            var valign = elm.getAttribute("data-valign");
            if(!valign) valign = me.opt["imageVAlign"];

            ih = jQuery(elm).outerHeight(true);
            iw = jQuery(elm).outerWidth();

            if(valign=="center") { //center
                jQuery(elm).css("margin-top", (h-ih)/2 + "px");
            } else if(valign=="bottom") {
                jQuery(elm).css("margin-top", (h-ih) + "px");
            }

        });

        //apply layer filter based on screen;
        var crw = jQuery(s).width();
        jQuery(s).find("[data-apply-on-width]").each(function(idx, elm) {
            var ssatt = elm.getAttribute("data-apply-on-width");
            var bound = [0, 100000];
            if(ssatt) {
                bound = ssatt.split("-");
                if(bound.length==1) bound.push(1000000);
                bound[0] = parseInt(bound[0], 10);
                bound[1] = parseInt(bound[1], 10);
            }

            if(crw<bound[0] || crw>bound[1]) {
                elm.style.display="none";
            } else {
                elm.style.display="";
            }
        });
        //-----

        if(me.opt["onRevalidate"]) me.opt.onRevalidate();

        jQuery(s).trigger("revalidate");

    };

    this.disable = function() {
        this.rt.disable = true;
        //hide nav
        jQuery(this.rt["scroller"]).find(".xpro-slider-nav").hide();
        jQuery(this.rt["scroller"]).find(".xpro-slider-pause").hide();
    };

    this.enable = function() {
        this.rt.disable = false;
        jQuery(this.rt["scroller"]).find(".xpro-slider-nav").show();
        /*jQuery(this.rt["scroller"]).find(".xpro-slider-pause")
            .css("display","")
            .addClass("xpro-slider-pause-selected");*/
    };

    /**
     * Set content position.
     * c: content/element
     * pos: H/V
     * x: multiply factor
     */
    function $_setContentPos(c, pos, x) {
        var e = c.elm;
        if(typeof(x)=="undefined") x = 0;
        switch(pos) {
            case "V":
                //e.style.top = (parseInt(e.style.height, 10)*x)+"px";
                e.style.top = (jQuery(e).outerHeight(true)*x)+"px";
                e.style.left = "0px";
                break;
            case "H":
                e.style.top = "0px";
                //e.style.left = (parseInt(e.style.width, 10)*x)+"px";
                e.style.left = (jQuery(e).outerWidth()*x)+"px";
                break;
        }
    };

    /**
     * Change slider mode:
     * m: mode = slide, in, slideOut
     * d: direction = left, right, up, down
     */
    this.prepareContent = function(m, d, cntdir) {

        if(this.isEmpty()) return;

        var s = this.rt["scroller"];

        //jQuery(s).removeClass("xpro-slider-animate-all");
        //jQuery(s).find("div.xpro-slider-item").removeClass("xpro-slider-animate-all");
        //
        jQuery(s).css("transition", 0);
        jQuery(s).find("div.xpro-slider-item").css("transition", "");

        switch(m) {
            case "slide":
            case "carousel":
            case "news":
                var orn = (d=="right"||d=="left")?"H":"V";
                var css = (orn=="H") ? "left" : "top";
                var dim = (orn=="H") ? "outerWidth" : "outerHeight";

                //jQuery(s).find("div.xpro-slider-content").removeClass("xpro-slider-animate-all");
                jQuery(s).find("div.xpro-slider-content").css("transition", "");
                jQuery(s).find("div.xpro-slider-content").css("transform", "")
                    .css("left", "0px")
                    .css("top", "0px");

                    if(me.opt["mode"]=="news" && me.opt["newsPreferredWidth"]!=null) {
                        //calculate item width.
                        var w = jQuery(s).width(), items,
                            iw, bound = me.opt["newsPreferredWidth"];
                        items = Math.ceil(w/bound);
                        me.rt["page_items"] = items;
                        iw = Math.ceil(w/items);
                        jQuery(s).find(".xpro-slider-item").css("width", iw+"px");
                    }

                var grp = this.getGroupedItems();

                var crc = this.content[this.rt.idx];
                jQuery(crc.elm).css(css, 0);

                var i, pos=0;
                for(i=0; i<grp.aL.length; i++) {
                    pos -= jQuery(grp.aL[i].elm)[dim](true);
                    jQuery(grp.aL[i].elm).css(css, pos);
                }

                pos=jQuery(crc.elm)[dim](true);
                for(i=0; i<grp.aR.length; i++) {
                    jQuery(grp.aR[i].elm).css(css, pos);
                    pos += jQuery(grp.aR[i].elm)[dim](true);
                }

                this.setItemStyleClass();

                break;

            case "slideOut":
            case "zoomOut":
            case "shrinkOut":
            case "fade":
            case "custom":

                //it is always ie, wth...
                jQuery(s).find("div.xpro-slider-content").css("overflow", "inherit");
                //--------------
                var tmp = this.content[this.rt.idx], i=0;
                do {
                    jQuery(tmp.elm).css("opacity", 1);
                    tmp.elm.style.zIndex = 1000-i;
                    $_setContentPos(tmp, "H", 0);
                    if(cntdir=='prev') {
                        tmp = tmp.pv;
                    } else {
                        tmp = tmp.nx;
                    }
                    i++;
                } while(tmp.idx!=this.rt.idx);

                jQuery(s).find("div.xpro-slider-item").css("transform", "");

                break;

        }

    };

    this.setItemStyleClass = function() {
        this.executeOnItem(
            function(cnt) {
                jQuery(cnt.elm)
                    .removeClass('xpro-slider-item-right xpro-slider-item-left')
                    .addClass('xpro-slider-item-selected');
            },
            function(cnt) {
                jQuery(cnt.elm)
                    .removeClass('xpro-slider-item-right xpro-slider-item-selected')
                    .addClass('xpro-slider-item-left');
            },
            function(cnt) {
                jQuery(cnt.elm)
                    .removeClass('xpro-slider-item-left xpro-slider-item-selected')
                    .addClass('xpro-slider-item-right'); }
        );
    };

    this.executeOnItem = function (crCb, lCb, rCb) {

        var grp = this.getGroupedItems();

        if(crCb) crCb(grp.cR);
        if(lCb) for(var i=0; i<grp.aL.length; i++) { lCb(grp.aL[i]); }
        if(rCb) for(var i=0; i<grp.aR.length; i++) { rCb(grp.aR[i]); }
    };

    this.getGroupedItems = function() {

        var sp, ep;
        if(!this.opt["loopcontent"]) {
            sp = this.content[0];
            ep = this.content[this.content.length-1];
        } else {
            var med = Math.floor(this.content.length/2);
            var epix = this.rt.idx + med;
            if(epix>=this.content.length) epix -= this.content.length;
            ep = this.content[epix];
            sp = ep.nx;
        }

        var aR=[], aL=[], crc = this.content[this.rt.idx], it;

        var tmp=crc;
        while(ep!=null && tmp.idx!=ep.idx) {
            tmp=tmp.nx; aR.push(tmp);
        }

        tmp=crc;
        while(sp!=null && tmp.idx!=sp.idx) {
            tmp=tmp.pv; aL.push(tmp);
        }

        return {"aR":aR, "aL": aL, "cR":crc};
    };

    this.forward = function(page) {
        if(this.rt.disable) return false;
        this.timerReset();

        if(!page) page = 1;

        if(page>1) {
            var crCnt = this.content[this.rt["idx"]];
            for(var it=0; it<page; it++) crCnt = crCnt.nx;
            this.slideTo(crCnt.idx);
        } else {
            this.prepareContent(this.opt.mode, this.opt.dir, 'next');
            if(this.opt.dir=="left" || this.opt.dir=="right") {
                $_runSlide("left", {cntdir:'next'});
            } else {
                $_runSlide("up", {cntdir:'next'});
            }
        }

        return true;
    };

    this.backward = function(page) {
        if(this.rt.disable) return false;
        this.timerReset();

        if(!page) page = 1;

        if(page>1) {
            var crCnt = this.content[this.rt["idx"]];
            for(var it=0; it<page; it++) crCnt = crCnt.pv;
            this.slideTo(crCnt.idx);
        } else {
            this.prepareContent(this.opt.mode, this.opt.dir, 'prev');
            if(me.opt.dir=="left" || me.opt.dir=="right") {
                $_runSlide("right", {cntdir:'prev'});
            } else {
                $_runSlide("down",{cntdir:'prev'});
            }
        }

        return true;
    };

    this.slideTo = function(idx) {
        if(this.rt.disable) return;

        $_loadImage(idx);

        this.stopSlider();

        this.timerReset();

        this.prepareContent(this.opt.mode, this.opt.dir);

        var steps = Math.abs(idx-this.rt.idx);
        var orient=this.rt["orient"];
        var css = orient=="H" ? "left" : "top";

        var selCnt = this.content[idx], crCnt=this.content[this.rt.idx];

        if(this.opt.mode=="news") {
            if(idx==this.rt.idx) return;
            if(jQuery(selCnt.elm).position()[css]<0) {
                steps = (idx<this.rt.idx) ? this.rt.idx-idx : this.content.length-idx+this.rt.idx;
                $_runSlide((orient=="H" ? "right" : "down"), {"steps":steps});
            } else {
                steps = (idx>this.rt.idx) ? idx-this.rt.idx : this.content.length-this.rt.idx+idx;
                $_runSlide((orient=="H" ? "left" : "up") , {"steps":steps});
            }
        } else if(this.opt.mode=="carousel") {

            if(steps>1) {
                jQuery([crCnt.elm, crCnt.nx.elm, crCnt.pv.elm])
                        //.addClass("xpro-slider-animate-all")
                        .css("transition", SLIDERANIM.transitionString())
                        .css("opacity", 0);

                jQuery([selCnt.elm, selCnt.nx.elm, selCnt.pv.elm])
                    //.removeClass("xpro-slider-animate-all")
                    .css("transition", "")
                    .css("opacity", 0);

                $_setContentPos(selCnt, orient, 0);
                $_setContentPos(selCnt.nx, orient, 1);
                $_setContentPos(selCnt.pv, orient, -1);
            }

            if(idx<this.rt.idx) {
                $_runSlide((orient=="H" ? "right" : "down"), {"steps":steps});

            } else if(idx>this.rt.idx) {
                $_runSlide((orient=="H" ? "left" : "up") , {"steps":steps});
            }

        } else if(this.opt.mode=="slideOut"
                || this.opt.mode=="fade"
                || this.opt.mode=="custom"
                || this.opt.mode=="zoomOut"
                || this.opt.mode=="shrinkOut") {

            var tmp = this.content[this.rt.idx].nx;
            while (tmp.idx!=this.content[this.rt.idx].idx) {
                tmp.elm.style.zIndex=1;
                tmp = tmp.nx;
            }

            this.content[idx].elm.style.zIndex = this.content[this.rt.idx].elm.style.zIndex-1;
            if(idx<this.rt.idx) {
                $_runSlide((orient=="H" ? "left" : "up"), {"steps":steps, cntdir:'prev'});
            } else if(idx>this.rt.idx) {
                $_runSlide((orient=="H" ? "right" : "down") , {"steps":steps, cntdir:'next'});
            }

        } else {

            if(this.rt.idx!=idx) {
                jQuery(selCnt.elm).css("opacity", 0);
            }
            if(idx<this.rt.idx) {
                $_setContentPos(crCnt.pv, orient, -2);
                $_setContentPos(selCnt, orient, -1);
                $_runSlide((orient=="H" ? "right" : "down"), {"steps":steps});

            } else if(idx>this.rt.idx) {
                $_setContentPos(crCnt.nx, orient, 2);
                $_setContentPos(selCnt, orient, 1);
                $_runSlide((orient=="H" ? "left" : "up") , {"steps":steps});
            }

        }
    };

    this.hightlightThumb = function(selIdx) {
        if(this.rt.disable) return;
        var cnt = this.content[selIdx];
        jQuery(this.rt["thumbnails"]).find(".xpro-thumb-item").removeClass("xpro-thumb-selected");
        jQuery(cnt.thm).addClass("xpro-thumb-selected");

        var slideable = XPRO.Controls.Slideable.slideables[this.rt["thumbnails"].id];
        slideable.slideToVisible(cnt.thm);
    };

    this.runSlideCss = function(dir, opt) {

        var currentIdx = me.rt.idx;

        var crCnt = this.content[this.rt.idx];

        var slideOpt={};

        var effmode = me.opt.mode;
        if(this.opt.mode=="custom") {
            var eff = $_parseEffect(crCnt.elm.getAttribute("data-effect"));
            if(eff && eff.length>0) {
                effmode = eff[0]["fname"];
                var op = eff[0]["opt"];
                if(typeof(op["dir"]) != "undefined") dir=op.dir;
                this.copyOptions(slideOpt, op);
            }
        }

        effmode = (opt && opt.mode) ? opt.mode : effmode;
        dir = (opt && opt.dir) ? opt.dir: dir;

        var orient = (dir=="right" || dir=="left") ? "H" : "V";
        var css = (orient=="H") ? "left" : "top";
        var x = (dir=="right" || dir=="down") ? 1 : -1;
        var start = parseInt(crCnt.elm.style[css], 10);
        var dist = (orient=="H") ? jQuery(crCnt.elm).outerWidth() : jQuery(crCnt.elm).outerHeight(true);
        var scrDist = (orient=="H") ? this.rt["width"] : this.rt["height"];
        var steps = (opt && opt.steps)?opt.steps:1;

        switch(effmode) {
            case "news":

                //start = parseInt(crCnt.elm.parentNode.style[css], 10);
                start = SLIDERANIM.getPosition(crCnt.elm.parentNode, orient);

                var abs = Math.abs(start), tmp=0, cnt=0, crc=crCnt;
                while(tmp<abs) {
                    tmp = tmp+jQuery(crc.elm)[(orient=="H"?"outerWidth":"outerHeight")](true);
                    if(x>0) { crc=crc.pv; } else { crc=crc.nx; }
                    cnt++;
                }
                if(cnt!=0) steps = cnt;

                var i = 0, dt=steps, totDist=0;
                while (i<steps) {
                    if(x>0) {
                        if(!this.opt["loopcontent"] && crCnt.idx==0) {dt=0; break;}
                        crCnt=crCnt.pv;
                        totDist += jQuery(crCnt.elm)[(orient=="H"?"outerWidth":"outerHeight")](true);
                    } else {
                        if(!this.opt["loopcontent"] && crCnt.idx==this.content.length-1) {dt=0; break;}
                        totDist += jQuery(crCnt.elm)[(orient=="H"?"outerWidth":"outerHeight")](true);
                        crCnt=crCnt.nx;
                    }
                    i++;
                }

                me.rt.idx = crCnt.idx;

                if(me.opt["loopcontent"]) {
                    tmp=0; crc = me.content[me.rt.idx];
                    var crpos=0;
                    while(tmp<scrDist) {
                        tmp += jQuery(crc.elm)[(orient=="H"?"outerWidth":"outerHeight")](true);
                        //crpos = jQuery(crc.elm).position()[css];
                        crpos = parseInt(crc.elm.style[css], 10);
                        if(x>0) {
                            crc=crc.pv;
                            //jQuery(crc.elm).css(css, crpos-jQuery(crc.elm)[(orient=="H"?"outerWidth":"outerHeight")](true));
                        } else {
                            crc=crc.nx;
                            jQuery(crc.elm).css(css, crpos+jQuery(crc.pv.elm)[(orient=="H"?"outerWidth":"outerHeight")](true));
                        }
                    }
                }

                $_loadImage();

                this.copyOptions(slideOpt, SLIDERANIM.getPropByOrient(orient, start, (x*totDist))) ;
                SLIDERANIM.slide(crCnt.elm.parentNode, slideOpt);

                break;

            case "slide":
            case "carousel":

                //start = parseInt(crCnt.elm.parentNode.style[css], 10);
                //start = SLIDERANIM.getTranslate(jQuery(crCnt.elm.parentNode).css("transform"))[0];
                start = SLIDERANIM.getPosition(crCnt.elm.parentNode, orient);

                var i = 0, dt=1;
                while (i<steps) {
                    if(x>0) {
                        if(!this.opt["loopcontent"] && crCnt.idx==0) {dt=0; break;}
                        crCnt=crCnt.pv;
                    } else {
                        if(!this.opt["loopcontent"] && crCnt.idx==this.content.length-1) {dt=0; break;}
                        crCnt=crCnt.nx;
                    }
                    i++;
                }
                me.rt.idx = crCnt.idx;

                $_loadImage();

                if(effmode=="carousel" && steps>1) { //do nothing
                } else {
                    this.copyOptions(slideOpt, SLIDERANIM.getPropByOrient(orient, start, (x*dist*dt)));
                    SLIDERANIM.slide(crCnt.elm.parentNode, slideOpt);
                }

                jQuery([crCnt.elm, crCnt.nx.elm, crCnt.pv.elm]).css("opacity", "")
                    .css("transition", SLIDERANIM.transitionString());

                jQuery(crCnt.elm).css("transform", "").css("opacity", 1);

                break;
            case "slideOut":
            case "fade":
            case "zoomOut":
            case "shrinkOut":

                //slide in only available in mode=custom, automatic mode only
                $_loadImage();

                var fcb = function(el) {
                    el.style.zIndex = 0;
                };
                if(effmode=="fade") {
                    slideOpt.finishCallback = fcb;
                    SLIDERANIM.fadeOut(crCnt.elm, slideOpt);
                } else if(effmode=="zoomOut") {
                    slideOpt.finishCallback = fcb;
                    SLIDERANIM.zoomOut(crCnt.elm, slideOpt);
                } else if(effmode=="shrinkOut") {
                    slideOpt.finishCallback = fcb;
                    SLIDERANIM.shrinkOut(crCnt.elm, slideOpt);
                } else {
                    start = SLIDERANIM.getPosition(crCnt.elm, orient);
                    this.copyOptions(slideOpt, SLIDERANIM.getPropByOrient(orient, start, (x*dist)));
                    SLIDERANIM.slide(crCnt.elm, slideOpt);
                }

                if((opt && opt.steps)) { //if call from slideTo
                    var i = 0;
                    while (i<steps) {
                        if(opt.cntdir && opt.cntdir=='prev') {
                            crCnt=crCnt.pv;
                        } else {
                            crCnt=crCnt.nx;
                        }
                        i++;
                    }
                } else {
                    if(opt.cntdir && opt.cntdir=='prev') {
                        crCnt=crCnt.pv;
                    } else {
                        crCnt=crCnt.nx;
                    }
                }
                me.rt.idx = crCnt.idx;
                break;


        }

        if(this.opt.onSlide) this.opt.onSlide(this.content[this.rt.idx], currentIdx);
        if(this.opt.thumbnails) this.hightlightThumb(this.rt.idx);
        if(this.opt.infoPanel) {
            if(this.opt.infoPanel.showInfo) {
                this.opt.infoPanel.showInfo(this.content[this.rt.idx]);
            } else {
                this.showInfo(this.content[this.rt.idx]);
            }
        }

        if(this.opt["autoHeightMode"]=="fitcontent" && this.opt["mode"]!="news") {
            jQuery(this.rt["scroller"]).css("transition", SLIDERANIM.transitionString("0.8s", "ease", "0.8s"));
            jQuery(this.rt["scroller"]).height(jQuery(this.content[this.rt.idx].elm).outerHeight(true));
        }

        //check for reverse kenburns
        jQuery(me.content[me.rt.idx].elm).find(".xpro-kenburns-reverse").each(function(idx, itm) {
            me.reverseKenburns(itm, false);
            jQuery(this).removeClass("xpro-kenburns-reverse");
        });

        setTimeout(function() {
            me.resetLayerAnim(currentIdx);
            me.stopLayerVideo(currentIdx);
        }, 1000);

        this.runLayerAnim(me.rt.idx);
        this.runLayerVideo(me.rt.idx);

        this.setItemStyleClass();
        this.showFloatThumb(me.rt.idx);
    };

    this.resetLayerAnim = function(index) {
        var crCnt = this.content[index], iprop;
        jQuery(crCnt.elm).find(".xpro-item-layer").each(function(idx, elm) {
            jQuery(elm).css("transition", "").css("transform", "");
            iprop = jQuery(elm).data("$normalprop");
            if(iprop) {
                jQuery(elm).css(iprop);
            }
        });
    };

    function $_scaleProp(opt, optlist, scale) {
        var fnScale = function(v) {
            var u = XPRO.getUnit(v);
            if(u=='px') { return (parseFloat(v) * scale); }
            return v;
        };
        var key, iniKey;
        for(var i=0; i<optlist.length;i++) {
            key = optlist[i];
            iniKey = "ini"+optlist[i];
            if(opt["opt"][key]) opt["opt"][key] = fnScale(opt["opt"][key]);
            if(opt["opt"][iniKey]) opt["opt"][iniKey] = fnScale(opt["opt"][iniKey]);
        }
    };

    this.runLayerAnim = function(index, type, elms) {

        var crCnt = this.content[index];
        var maxAnimTime = 0;

        if(!crCnt) return;

        var jqLay = jQuery(crCnt.elm).find(".xpro-item-layer");
        if(elms) jqLay = jQuery(elms);

        jqLay.each(function(idx, elm) {

            if(XPRO.getIEVersion() < me.opt.animatedLayerMinIE) {
                jQuery(elm).hide();
                return true;
            }


            var fw = Math.floor(jQuery(crCnt.elm).width()/100)*100;
            jQuery(elm).removeClass(function(idx, css) {
                return (css.match (/(^|\s)xpro-item-layer-\S+/g) || []).join(' ');
            });
            jQuery(elm).addClass("xpro-item-layer-"+fw);

            var ef = elm.getAttribute("data-effect" + (!type?"":("-"+type)));
            var elist = $_parseEffect(ef), o;
            var scale = me.getScale();

            for(var i=0; i<elist.length; i++) {
                o=elist[i];
                o["opt"].parent = crCnt.elm;
                o["opt"].asOffset=true;
                o["opt"].ratio=scale;
                if(type=="out") o["opt"].skipInit=true;

                $_scaleProp(o, ["X","Y","Z"], scale);

                var at = $_parseAnimTime(o["opt"]["delay"], o["opt"]["duration"]);
                if(at>maxAnimTime) maxAnimTime = at;

                XPRO.Controls.Slider.Anim[o["fname"]](elm, o["opt"]);

            }

        });

        return maxAnimTime;
    };

    this.stopLayerVideo = function(idx) {
        //check if there is html 5 video, if there is play it.
        jQuery(me.content[idx].elm).find("video").each(function() {
            if(!this.paused || !this.ended || this.playing) {
                this.pause();
            }
        });
    };

    this.runLayerVideo = function(idx) {

        if(me.isEmpty()) return;

        //check if there is html 5 video, if there is play it.
        jQuery(me.content[idx].elm).find("video").each(function() {
            if(this.paused || this.ended || !this.played) {
                this.play();
            }
        });
    };

    this.showInfo = function(cnt) {

        var infopanel = "#" + this.opt.infoPanel.panelId;

        var infocontent = jQuery(infopanel).find(".xpro-slider-info");
        if(infocontent.length==0) {
            jQuery("<div class='xpro-slider-info'></div>").appendTo(infopanel);
            jQuery(infopanel).find(".xpro-slider-info").html(cnt.info).fadeIn('slow');
        } else {
            infocontent.fadeOut('slow', function() {
                infocontent.html(cnt.info).delay(100).fadeIn(cnt.info);
            });
        }

    };

    this.showSlider = function() {
        var s = this.rt["scroller"];
        var c = jQuery(s).parent(".xpro-slider-container");

        if(!jQuery(c).is(":visible")) {

            var dv;
            if(jQuery(".xpro-slider-overlay").length==0) {
                dv = jQuery("<div class='xpro-slider-overlay'></div>");
                jQuery(dv)
                    .width(jQuery(window).width())
                    .height(jQuery(window).height())
                    .css("opacity", 0)
                    .appendTo(jQuery(document.body))
                    .on("click", function() {
                        me.hideSlider();
                    });

            } else {
                dv = jQuery(".xpro-slider-overlay").show();
            }
            setTimeout(function() {
                jQuery(dv).css("opacity", 0.8);
            }, 1);

            jQuery(s).parent(".xpro-slider-container").show();

            jQuery(s).on("revalidate", function() {
                jQuery(c).css("left", (jQuery(window).width()-jQuery(c).width())/2);
                jQuery(c).css("top", (jQuery(window).height()-jQuery(c).outerHeight(true))/2);
            });

            this.revalidate();

        }

        setTimeout(function() {
            if(me.opt.autoRun==true) me.run();
        }, 0 );

    };

    this.hideSlider = function() {
        this.stopSlider();
        var s = this.rt["scroller"];
        jQuery(s).parent(".xpro-slider-container").hide();
        jQuery(".xpro-slider-overlay").css("opacity", 0);
        setTimeout(function() {
            jQuery(".xpro-slider-overlay").hide();
        }, 600);
    };

    this.stopSlider = function() {
        if(me.rt["tm"]!=null) {
            clearInterval(me.rt["tm"]);
            me.rt["tm"] = null;
        }
    };

    this.play = function() {
        this.run();
        this.rt.paused=false;
        var s = this.rt["scroller"], p = jQuery(s).find("div.xpro-slider-pause");
        p.css('display', '').css("opacity", "").stop().addClass("xpro-slider-play xpro-slider-pause-selected");
        setTimeout(function() {
            p.fadeOut('slow', function() {
                jQuery(this).removeClass("xpro-slider-play xpro-slider-pause-selected");
            });
        }, 1000);
        if(me.rt.disable==false) p.css("display", "");
    };

    this.pause = function() {
        this.stopSlider();
        this.rt.paused=true;
        var s = this.rt["scroller"], p = jQuery(s).find("div.xpro-slider-pause");
        p.css('display', '').css("opacity", "").stop()
                .removeClass("xpro-slider-play")
                .addClass("xpro-slider-pause-selected");
        setTimeout(function() {
            p.fadeOut('slow', function() {
                jQuery(this).removeClass("xpro-slider-pause-selected");
            });
        }, 1000);
    };

    this.timerReset = function() {
        this.rt["tmprog"] = 0;
        jQuery(".xpro-slider-progress-content").css("width", "0%" );
    };

    this.run = function() {

        if(this.rt.disable) return;

        var progDelay = 1000;

        if(!me.rt["tm"] || me.rt["tm"]==null) {
            this.rt["tm"] = setInterval(function() {

                if(!me.rt["tmprog"]) me.rt["tmprog"] = 0;
                me.rt["tmprog"] += 20;

                if(me.rt["tmprog"]>=me.opt.interval) {

                    me.timerReset();
                    me.stopSlider();

                    var totTime = me.runLayerAnim(me.rt.idx, "out");
                    setTimeout(function() {
                        if(me.opt.dir=='left' || me.opt.dir=='up') {
                            me.forward();
                        } else {
                            me.backward();
                        }
                        me.run();
                    }, totTime);

                }
                if(me.opt.showProgress) {
                    if(me.rt["tmprog"]>progDelay) {
                        jQuery(me.rt["scroller"]).find(".xpro-slider-progress-content").css("width", ((me.rt["tmprog"]-progDelay)/(me.opt.interval-progDelay))*100 + "%" );
                    }
                }

            }, 20);
        }

    };

};

XPRO.Controls.Slideable = {

    slideables: {},

    /**
     *opt {orient}
     */
    slideable: function(id, opt) {

        var me = this;
        var s = jQuery("#"+id).get(0);
        var pnl = (opt && opt.panel) ? opt.panel : jQuery(s).children("div.xpro-thumb-content").get(0);

        var o = {"orient": "H"};
        if(opt) for(var it in opt) {o[it] = opt[it]};
        var slide = {"opt": o, "container" : s, "panel" : pnl, "rt":{} };

        var SLIDERANIM = XPRO.Controls.Slider.Anim;

        //add nav
        if(o["navigation"]!==false) {
            jQuery(s).append("<div class='xpro-thumb-nav xpro-thumb-nav-prev'><span class='xpro-slider-icon'></span></div><div class='xpro-thumb-nav xpro-thumb-nav-next'><span class='xpro-slider-icon'></span></div>");
            jQuery(s).find("div.xpro-thumb-nav-prev").bind("click", function() {slide.movePrev();});
            jQuery(s).find("div.xpro-thumb-nav-next").bind("click", function() {slide.moveNext();});

            jQuery(s).bind("mouseover", function() {
                jQuery(s).find("div.xpro-thumb-nav").addClass("xpro-thumb-nav-selected");
            });
            jQuery(s).bind("mouseout", function() {
                jQuery(s).find("div.xpro-thumb-nav").removeClass("xpro-thumb-nav-selected");
            });
        }

        var dragStart = function(ddevent) {
            ddevent.startPos = SLIDERANIM.getPosition(pnl, o.orient)||0;
            jQuery(pnl).css("transition", "");
        };
        var drag = function(ddevent) {
            var dt = (o.orient=="H") ? (ddevent.screenX - ddevent.startedAt.x)
                                     : (ddevent.screenY - ddevent.startedAt.y);

            SLIDERANIM.setPosition(pnl, o.orient, (ddevent.startPos + dt)+"px");

            slide.rt["ondrag"] = true;
        };
        var drop = function(ddevent) {
            var d = SLIDERANIM.getPosition(pnl, o.orient) - ddevent.startPos ;
            if(d<0) {
                slide.moveNext(d);
            } else if(d>0) {
                slide.movePrev(d);
            }
        };

        XPRO.Controls.DnDSession.addDragNDrop(s, {
            onInitiate : function(ddevent) {slide.rt["ondrag"]=false;},
            onDragStart : dragStart,
            onDrag : drag,
            onDrop : drop
        });

        XPRO.Controls.DnDSession.addTouchDragNDrop(s, {
            onDragStart : dragStart,
            onDrag : drag,
            onDrop : drop
        });

        slide.moveNext = function(offset) {
            var s = this.container, pnl = this.panel,
            c = SLIDERANIM.getPosition(pnl, o.orient),
            f = SLIDERANIM.DIM[o.orient];

            var limit = Math.abs(c) + jQuery(s)[f](true) + (offset||0), tmp=0;
            jQuery(pnl).find(".xpro-thumb-item").each(function(idx, elm) {
                if(tmp+jQuery(elm)[f](true) > limit) return false;
                tmp+=jQuery(elm)[f](true);
            });
            if(tmp+jQuery(s)[f](true)>jQuery(pnl)[f](true)) {
                tmp = jQuery(pnl)[f](true)-jQuery(s)[f](true);
            }
            this.slide(pnl, c, -tmp, {orient:o.orient});
        };

        slide.movePrev = function(offset) {
            var s = this.container, pnl = this.panel,
            c = SLIDERANIM.getPosition(pnl, o.orient),
            f = SLIDERANIM.DIM[o.orient];

            var limit = Math.abs(c) - jQuery(s)[f](true) - (offset||0), tmp=0;
            if(limit>0) {
                jQuery(pnl).find(".xpro-thumb-item").each(function(idx, elm) {
                    tmp+=jQuery(elm)[f](true);
                    if(tmp > limit) return false;
                });
            }

            this.slide(pnl, c, -tmp, {orient:o.orient});
        };

        slide.resetPosition = function() {
            jQuery(pnl).css("transition", "").css("transform", "");
            jQuery(pnl).css("top", "").css("left", "");
        };

        slide.slideToVisible = function(item) {

            var c = SLIDERANIM.getPosition(pnl, o.orient)||0,
            f = SLIDERANIM.DIM[o.orient];

            var limit = Math.abs(c) + jQuery(s)[f](true), tmp=0;

            jQuery(pnl).find(".xpro-thumb-item").each(function(idx, elm) {
                tmp+=jQuery(elm)[f](true);
                if(elm===item) return false;
            });

            var maxLimit = jQuery(pnl)[f](true)-jQuery(s)[f](true)+5;

            if(tmp>=limit) {
                tmp = tmp-jQuery(s)[f](true)+jQuery(item)[f](true);
                if(tmp+Math.abs(c)>=maxLimit) {
                    tmp = maxLimit;
                }
                this.slide(pnl, c, -tmp, {orient:o.orient});
            } else {
                tmp=tmp-jQuery(item)[f](true);
                if(tmp < Math.abs(c)) {
                    this.slide(pnl, c, -tmp, {orient:o.orient});
                }
            }
        };

        slide.slide=function(el, start, end, opt) {
            SLIDERANIM.slide(el,
                SLIDERANIM.getPropByOrient(opt.orient, start, end));
        };

        this.slideables[id] = slide;

        return slide;
    }


};

XPRO.Controls.DnDSession = {

    /**
     * el object where dragdrop attached
     * ddevent drag drop event object
     */

    addDragNDrop : function(el, ddevent) {

        ddevent.el = el;
        ddevent.init = false;       //drag init flag
        ddevent.started = false;    //drag started flag
        ddevent.startedAt = null;   //drag started at coordinate

        jQuery(el).on("mousedown", function(event) {

            //comment out because textbox won't focus of this is enabled.
            //event.preventDefault();
            event.stopPropagation();

            if(event.button!=0) return;

            ddevent.init = true;
            ddevent.startedAt = {x:event.screenX, y:event.screenY};
            ddevent.event = event;

            if(ddevent.onInitiate) ddevent.onInitiate(ddevent);

            var ddmouseMove = function(event) {
                if(ddevent.init) {

                    event.preventDefault();

                    ddevent.event = event;

                    if(ddevent.started) {
                        //do drag...
                        ddevent.screenX = event.screenX;
                        ddevent.screenY = event.screenY;
                        if(ddevent.onDrag) ddevent.onDrag(ddevent);
                    } else {
                        if(Math.abs(event.screenX-ddevent.startedAt.x)>1 ||
                            Math.abs(event.screenY-ddevent.startedAt.y)>1) {
                            ddevent.started = true;
                            if(ddevent.onDragStart) ddevent.onDragStart(ddevent);
                        }
                    }
                }
            };
            var ddmouseUp = function(event) {

                event.stopPropagation();
                event.preventDefault();

                ddevent.event = event;
                ddevent.screenX = event.screenX;
                ddevent.screenY = event.screenY;

                if(ddevent.started==true && ddevent.onDrop) ddevent.onDrop(ddevent);

                ddevent.started = false;
                ddevent.init = false;

                setTimeout(function() {
                    jQuery(document).off("mousemove", ddmouseMove);
                    jQuery(document).off("mouseup", ddmouseUp);
                }, 20);
            };

            jQuery(document).on("mousemove",  ddmouseMove);
            jQuery(document).on("mouseup", ddmouseUp);

        });

        return ddevent;
    },

    addTouchDragNDrop: function(el, ddevent) {

        ddevent.el = el;
        ddevent.init = false;       //drag init flag
        ddevent.started = false;    //drag started flag
        ddevent.startedAt = null;   //drag started at coordinate

        jQuery(el).on("touchstart", function(event){
            var ev = event.originalEvent;
            var t = ev.changedTouches;
            ddevent.init = true;
            //ev.preventDefault();
            //ddevent.started = true;
            ddevent.event = ev;
            ddevent.startedAt = {x:t[0].screenX, y:t[0].screenY};
            if(ddevent.onDragStart) ddevent.onDragStart(ddevent);
        });

        jQuery(el).on("touchmove", function(event){
            var ev = event.originalEvent;
            var t = ev.changedTouches;
            ddevent.event = ev;
            if(Math.abs(t[0].screenX-ddevent.startedAt.x)>5 ||
                Math.abs(t[0].screenY-ddevent.startedAt.y)>5) {
                ddevent.started = true;

                if(ddevent.context.opt.dir=='left' || ddevent.context.opt.dir=='right') {
                    ev.preventDefault();
                }

                ddevent.screenX = t[0].screenX;
                ddevent.screenY = t[0].screenY;
                if(ddevent.onDrag) ddevent.onDrag(ddevent);
            }

        });

        jQuery(el).on("touchend", function(event){
            var ev = event.originalEvent;
            var t = ev.changedTouches;
            if(ddevent.started) {
                ev.preventDefault();
                ddevent.init = false;
                ddevent.event = ev;
                ddevent.screenX = t[0].screenX;
                ddevent.screenY = t[0].screenY;
                if(ddevent.onDrop) ddevent.onDrop(ddevent);
            }
            ddevent.started = false;
        });

        return ddevent;
    }

};

XPRO.Controls.Slider.Anim = {

    POS: {"H":"left", "V":"top"},
    DIM: {"H":"outerWidth", "V":"outerHeight"},
    VAL: {"H":0, "V":1},
    TRX: {"H":"X", "V":"Y"},

    EASING: {
        "ease"              : "ease",
        "ease-in"           : "ease-in",
        "ease-out"          : "ease-out",
        "ease-in-out"       : "ease-in-out",
        "linear"            : "linear",
        "ease-in-cubic"     : [0.550, 0.055, 0.675, 0.190],
        "ease-in-expo"      : [0.755, 0.050, 0.855, 0.060],
        "ease-in-circ"      : [0.600, 0.040, 0.980, 0.335],
        "ease-in-bounce"    : [0.600, -0.280, 0.735, 0.045],

        "ease-out-cubic"    : [0.215, 0.610, 0.355, 1.000],
        "ease-out-expo"     : [0.230, 1.000, 0.320, 1.000],
        "ease-out-circ"     : [0.075, 0.820, 0.165, 1.000],
        "ease-out-bounce"   : [0.175, 0.885, 0.320, 1.275],

        "ease-inout-cubic"  : [0.645, 0.045, 0.355, 1.000],
        "ease-inout-expo"   : [0.860, 0.000, 0.070, 1.000],
        "ease-inout-circ"   : [0.785, 0.135, 0.150, 0.860],
        "ease-inout-bounce" : [0.680, -0.550, 0.265, 1.550]
    },

    JSEASING: {
        'ease'      : function(t) { return Math.pow(t, 2); }
    },

    EFFECT: {
        'flip-in-up'        : {"iniRotateX":"-179deg", "rotateX":"0deg", "iniOpacity":0, opacity:1},
        'flip-in-down'      : {"iniRotateX":"179deg", "rotateX":"0deg", "iniOpacity":0, opacity:1},
        'flip-in-right'     : {"iniRotateY":"-179deg", "rotateY":"0deg", "iniOpacity":0, opacity:1},
        'flip-in-left'      : {"iniRotateY":"179deg", "rotateY":"0deg", "iniOpacity":0, opacity:1},
        'flip-out-up'       : {"iniRotateX":"0deg", "rotateX":"-179deg", "iniOpacity":1, opacity:0},
        'flip-out-down'     : {"iniRotateX":"0deg", "rotateX":"179deg", "iniOpacity":1, opacity:0},
        'flip-out-right'    : {"iniRotateY":"0deg", "rotateY":"-179deg", "iniOpacity":1, opacity:0},
        'flip-out-left'     : {"iniRotateY":"0deg", "rotateY":"179deg", "iniOpacity":1, opacity:0},
        'rotate-in-right'   : {"iniRotateZ":"-179deg", "rotateZ":"0deg", "iniOpacity":0, opacity:1},
        'rotate-in-left'    : {"iniRotateZ":"179deg", "rotateZ":"0deg", "iniOpacity":0, opacity:1},
        'rotate-out-right'  : {"iniRotateZ":"0deg", "rotateZ":"179deg", "iniOpacity":1, opacity:0},
        'rotate-out-left'   : {"iniRotateZ":"0deg", "rotateZ":"-179deg", "iniOpacity":1, opacity:0},
        'zoom-in'           : {"iniScale": '0.01', "scale": '1', "iniOpacity":0, opacity:1},
        'zoom-out'          : {"iniScale": '1', "scale": '0.01', "iniOpacity":1, opacity:0},
        'skew-in-left'      : {"iniSkewX": '-60deg', "skewX": '0deg', "iniOpacity":0, opacity:1},
        'skew-in-right'     : {"iniSkewX": '60deg', "skewX": '0deg', "iniOpacity":0, opacity:1},
        'skew-out-left'     : {"iniSkewX": '0deg', "scaleX": '-60deg', "iniOpacity":1, opacity:0},
        'skew-out-right'    : {"iniSkewX": '0deg', "scaleX": '60deg', "iniOpacity":1, opacity:0},
        'skew-in-up'        : {"iniSkewY": '60deg', "skewY": '0deg', "iniOpacity":0, opacity:1},
        'skew-in-down'      : {"iniSkewY": '-60deg', "skewY": '0deg', "iniOpacity":0, opacity:1},
        'skew-out-up'       : {"iniSkewY": '0deg', "scaleY": '60deg', "iniOpacity":1, opacity:0},
        'skew-out-down'     : {"iniSkewY": '0deg', "scaleY": '-60deg', "iniOpacity":1, opacity:0}
    },

    duration: "1s",
    easing: "ease",

    transitionString: function(dur, easefunc, delay) {
        if(!dur) dur = this.duration;
        if(!easefunc) easefunc = this.easing;
        if(!delay) delay = "0s";

        var ease = this.EASING[easefunc];
        if(typeof(ease)=="string") {
            //do nothing
        } else {
            ease = "cubic-bezier(" + ease.join(",") + ")";
        }
        return "all " + dur + " " + ease + " " + delay;
    },

    support3D: (function() {
        var st = document.createElement('p').style,
            pre = ['ms','O','Moz','Webkit'];

        if( 'transition' in st ) return true;

        for (var i=0; i<pre.length; i++) {
            if(pre[i]+'Transition' in st) return true;
        }

        return false;

    })(),

    convertEffect: function(opt) {
        for(var it in opt) {
            var key = it + "-" + opt[it];
            if(this.EFFECT[key]) {
                XPRO.copyOptions(opt, this.EFFECT[key]);
            }
        }
    },

    animate: function(el, opt) {
        this.slide(el, opt);
    },

    /**
     * opt: X, Y, Z, iniX, iniY, iniZ
     */
    slide: function(el, opt) {
        if(this.support3D) {
            this.slideCss(el, opt);
        } else {
            this.slideJs(el, opt);
        }
    },

    slideCss: function(el, opt) {

        var ratio  = opt["ratio"]||1;
        var parent = {"X": (opt.parent? jQuery(opt.parent).outerWidth() : 1),
                      "Y": (opt.parent? jQuery(opt.parent).outerHeight() : 1),
                      "Z": 1};

        this.convertEffect(opt);

        if(opt["skipInit"]!=true) this.setInit(el, opt);

        var me= this;

        setTimeout(function() {

            jQuery(el).css("transition", me.transitionString(opt["duration"], opt["easing"], opt["delay"]));

            var tr = [], p=["X", "Y", "Z"];
            tr.push("perspective(800px)");
            for(var i=0; i<p.length; i++) {
                if(opt[p[i]]!=null) {
                    if(opt[p[i]].toString().indexOf("%")!=-1) {
                        opt[p[i]] = (parseInt(opt[p[i]])/100)*parent[p[i]];
                    }
                    tr.push("translate"+p[i]+"("+(opt[p[i]])+"px)");
                }
            }
            if(opt["scale"]!=null) tr.push("scale("+(opt.scale)+")");
            if(opt["skewX"]!=null) tr.push("skewX("+(opt.skewX)+")");
            if(opt["skewY"]!=null) tr.push("skewY("+(opt.skewY)+")");
            if(opt["rotateX"]!=null) tr.push("rotate3d(1,0,0,"+(opt.rotateX)+")");
            if(opt["rotateY"]!=null) tr.push("rotate3d(0,1,0,"+(opt.rotateY)+")");
            if(opt["rotateZ"]!=null) tr.push("rotate3d(0,0,1,"+opt.rotateZ+")");
            if(tr.length>0) jQuery(el).css("transform", tr.join(" "));

            if(opt["opacity"]!=null) {} else opt["opacity"]=1;
            jQuery(el).css("opacity", opt["opacity"]);

        }, 100);
    },

    slideJs: function(el, opt) {
        var rX = opt.ratioX ? opt.ratioX : 1;
        var rY = opt.ratioY ? opt.ratioY : 1;
        var parentX = opt.parent? jQuery(opt.parent).width() : 1;
        var parentY = opt.parent? jQuery(opt.parent).height() : 1;
        var parentZ = 1;

        //set initial position
        if(opt["iniX"]!=null) jQuery(el).css("left", opt["iniX"] + "px");
        if(opt["iniY"]!=null) jQuery(el).css("top", opt["iniY"] + "px");
        if(opt["opacity"]!=null) {} else opt["opacity"]=1;

        if(!opt.animCallback) opt.animCallback=[];

        if(typeof (opt['X']) != "undefined") {
            opt.iniX = this.getPosition(el, 'H');
            if(opt["X"].toString().indexOf("%")!=-1) {
                opt.X = (parseInt(opt.X)/100)*parentX;
            }
            opt.dx = (opt.asOffset) ? opt.X : (opt.X-(opt.iniX||0));
            if(opt.dx!=0) jQuery(el).css("right", "");
            opt.animCallback.push(function(el, d) {
                jQuery(el).css("left", (opt.iniX + d*opt.dx) + "px");
            });

        }
        if(typeof (opt['Y']) != "undefined") {
            opt.iniY = this.getPosition(el, 'V');
            if(opt["Y"].toString().indexOf("%")!=-1) {
                opt.Y = (parseInt(opt.Y)/100)*parentY;
            }
            opt.dy = (opt.asOffset) ? opt.Y : (opt.Y-(opt.iniY||0));
            if(opt.dy!=0) jQuery(el).css("bottom", "");
            opt.animCallback.push(function(el, d) {
                jQuery(el).css("top", (opt.iniY + d*opt.dy) + "px");
            });
        }

        if(typeof(opt["opacity"]) != "undefined") {
            var iniOpa = jQuery(el).css("opacity")||1;
            opt.dopa = opt["opacity"]-iniOpa;
            opt.animCallback.push(function(el, d) {
                jQuery(el).css("opacity", (iniOpa+d*opt.dopa));
            });
        }

        this.doJsAnimate(el, opt);

    },

    getEasing: function(name) {
        if(this.JSEASING[name]) {
            return this.JSEASING[name];
        } else {
            return this.JSEASING['ease'];
        }
    },

    getMsValue: function(time) {
        if(time.match(/ms$/gi)) {
            return parseFloat(time);
        } else if(time.match(/s$/gi)) {
            return parseFloat(time)*1000;
        } else {
            return time;
        }
    },

    doJsAnimate: function(cnt, opt) {

        if(typeof(opt)=="undefined") opt = {};

        if(!opt['easing']) opt['easing'] = "ease";
        if(!opt['duration']) opt['duration'] = "800";
        opt['duration'] = this.getMsValue(opt['duration']);
        if(!opt['delay']) opt['delay'] = "0";
        opt['delay'] = this.getMsValue(opt['delay']);

        var me=this;
        setTimeout(function() {
            me.jsAnimate(cnt, opt);
        }, opt["delay"]);
    },

    jsAnimate: function(cnt, opt) {

        var easingFunction = this.getEasing(opt.easing);

        var start = new Date(), i;
        var tm = setInterval(function() {

            var passed = (new Date()) - start;
            var progress = passed/opt['duration'];
            if(progress > 1) progress = 1;

            var d = easingFunction(progress);

            //update css here.
            if(typeof(opt.animCallback) != "undefined") {
                for(i=0;i<opt.animCallback.length;i++) {
                    opt.animCallback[i](cnt, d);
                }
            }

            if(progress == 1) {
                clearInterval(tm);
                if(typeof(opt.finishCallback)!="undefined") opt.finishCallback(cnt);
            }

        }, 20);
    },

    fadeIn: function (el, opt) {
        var me = this;
        if(this.support3D) {

            setTimeout(function() {
                //jQuery(el).addClass("xpro-slider-animate-all");
                jQuery(el).css("transition", me.transitionString(opt["duration"], opt["easing"], opt["delay"]));

                //if(opt["duration"]!=null) jQuery(el).css("transition-duration", opt["duration"]+"ms");
                //if(opt["delay"]!=null) jQuery(el).css("transition-delay", opt["delay"]+"ms");

                jQuery(el).css("opacity", 1);
            }, 0);

            var f = function() {
                setTimeout(function() {
                    if(jQuery(el).css("opacity")>0.9) {
                        //check callback
                        if(opt && opt.finishCallback) opt.finishCallback(el);
                    } else { f(); }
                }, 200);
            };
            f();

        } else {
            if(!opt) opt = {};
            if(!opt.animCallback) opt.animCallback = [];
            opt.animCallback.push(function(el, d) {
                jQuery(el).css("opacity", ((d)));
            });
            this.doJsAnimate(el, opt);
        }
    },

    fadeOut: function (el, opt) {
        var me  = this;
        if(this.support3D) {
            setTimeout(function() {
                jQuery(el).css("transition", me.transitionString(opt["duration"], opt["easing"], opt["delay"]));

                jQuery(el).css("opacity", 0);
                if(opt && opt.scale) jQuery(el).css("transform", "scale(" + opt.scale + ")");
            }, 0);

            var f = function() {
                setTimeout(function() {
                    if(jQuery(el).css("opacity")<0.01) {
                        //check callback
                        if(opt && opt.finishCallback) opt.finishCallback(el);
                    } else { f(); }
                }, 200);
            };
            f();

        } else {
            if(!opt) opt = {};
            if(!opt.animCallback) opt.animCallback = [];
            opt.animCallback.push(function(el, d) {
                jQuery(el).css("opacity", ((1-d)));
            });
            this.doJsAnimate(el, opt);
        }
    },

    zoomOut: function (el, opt) {
        if(!opt) opt = {};
        if(typeof(opt.scale)=='undefined') opt.scale = 2;
        this.fadeOut(el, opt);
    },

    shrinkOut: function (el, opt) {
        if(!opt) opt = {};
        opt.scale = 0.1;
        this.fadeOut(el, opt);
    },

    kenBurns: function (el, opt) {
        this.slide(el, opt);
    },

    setInit: function(el, opt) {
        var ratio = opt.ratio||1;
        var parent = {"iniX": (opt.parent? jQuery(opt.parent).width() : 1),
                      "iniY": (opt.parent? jQuery(opt.parent).height() : 1),
                      "iniZ": 1};

        jQuery(el).css("transition", "");

        var tr = [], p=["iniX", "iniY", "iniZ"];
        for(var i=0; i<p.length; i++) {
            if(opt[p[i]]!=null) {
                if(opt[p[i]].toString().indexOf("%")!=-1) {
                    opt[p[i]] = (parseInt(opt[p[i]])/100)*parent[p[i]];
                }
                tr.push("translate"+p[i]+"("+(opt[p[i]])+"px)");
            }
        }
        if(opt["iniScale"]!=null) tr.push("scale("+(opt.iniScale)+")");
        if(opt["iniSkewX"]!=null) tr.push("skewX("+(opt.iniSkewX)+")");
        if(opt["iniSkewY"]!=null) tr.push("skewY("+(opt.iniSkewY)+")");
        if(opt["iniRotateX"]!=null) tr.push("rotateX("+(opt.iniRotateX)+")");
        if(opt["iniRotateY"]!=null) tr.push("rotateY("+(opt.iniRotateY)+")");
        if(opt["iniRotateZ"]!=null) tr.push("rotateZ("+opt.iniRotateZ+")");

        if(tr.length>0) jQuery(el).css("transform", tr.join(" "));

        if(opt["iniOpacity"]!=null) jQuery(el).css("opacity", opt["iniOpacity"]);

    },

    getTranslate: function(m) {
        var a;
        if(m.match(/matrix3d/i)) {
            a = m.replace(/matrix3d\(/gi, "").replace(/\)/g, "").replace(/\s/gi, "").split(",");
            return [a[12]*1, a[13]*1, a[14]*1];
        } else if(m.match(/matrix/i)) {
            a = m.replace(/matrix\(/gi, "").replace(/\)/g, "").replace(/\s/gi, "").split(",");
            return [a[4]*1, a[5]*1, 0];
        }
        return [0, 0, 0];
    },

    getPosition: function(el, orient) {
        if(this.support3D) {
            return this.getTranslate(jQuery(el).css("transform"))[this.VAL[orient]];
        } else {
            //return parseInt(jQuery(el).css(this.POS[orient]), 10);
            return jQuery(el).position()[this.POS[orient]];
        }
    },

    setPosition: function(el, orient, val) {
        if(this.support3D) {
            jQuery(el).css("transform", "translate"+this.TRX[orient]+"("+val+")");
        } else {
            jQuery(el).css(this.POS[orient], val)
        }
    },

    getPropByOrient: function(or, start, end) {
        var t = (or=="H"?"X":"Y"), o={};
        o["ini"+t] = start;
        o[t] = end;
        return o;
    }

};

XPRO.Controls.PreviewBox = function() {

    var me = this;

    this.opt = {
        "width"         : "80%",
        "height"        : "80%",
        "showCallback"  : null,
        "closeCallback" : null,
        "url"           : "",
        "type"          : 'iframe' //iframe
    };

    this.show = function(opt) {

        for(var it in opt) { this.opt[it] = opt[it]; };

        var w = this.opt.width;
        if(XPRO.getUnit(this.opt.width)=="%") {
            w = parseFloat(this.opt.width) * jQuery(window).width() / 100;
        };
        var h = this.opt.height;
        if(XPRO.getUnit(this.opt.height)=="%") {
            h = parseFloat(this.opt.height) * jQuery(window).height() / 100;
        };

        var re = /\.(jpeg|jpg|gif|png)$/gi;
        var isImage = (this.opt.url.match(re) != null);

        if(this.opt.url) {
            if(isImage) {
                //show the image, centered.
                var img = new Image();
                jQuery(img).on("load", function () {

                    var maxW = 0.8*jQuery(window).width(),
                        maxH = 0.8*jQuery(window).height(),
                        w = img.naturalWidth, h = img.naturalHeight;

                    if(w>maxW) {
                        w = maxW;
                        h = w*img.naturalHeight/img.naturalWidth;
                    }

                    if(h>maxH) {
                        h = maxH;
                        w = h*img.naturalWidth/img.naturalHeight;
                    }

                    jQuery(".xpro-previewbox-content")
                        .css("width", w+"px")
                        .css("height", h+"px")
                        .html("<img src='"+me.opt.url+"' style='width:100%px;height:100%' />");
                    jQuery(".xpro-previewbox").fadeIn('slow', function() {
                        if(me.opt.showCallback) me.opt.showCallback();
                    });



                    me.invalidate();
                });
                img.src = me.opt.url;
                jQuery('.xpro-previewbox').hide();
                jQuery('.xpro-previewbox-container').fadeIn('slow');

            } else if(this.opt.type=='iframe' || this.opt.type=='video') {

                var html = "";
                if(this.opt.type=='video') {
                    var vdata = XPRO.createVideoProperties(opt);
                    html = vdata.videoHTML;
                } else {
                    html = "<iframe style='display:block' class='xpro-frame' src='"+this.opt.url+"'></iframe>";
                }

                jQuery(".xpro-previewbox-content").css({width:"", height:""}).html(html);
                jQuery(".xpro-previewbox-content").find("iframe, video")
                        .css("width", w+"px")
                        .css("height", h+"px");
                jQuery('.xpro-previewbox').show();
                jQuery(".xpro-previewbox-container").fadeIn('slow', function() {
                    if(me.opt.showCallback) me.opt.showCallback();
                });
                me.invalidate();

            } else {
                //load ajax
                jQuery.ajax({
                    "url": me.opt.url,
                    "dataType": "html"
                }).done(function(data){
                    jQuery(".xpro-previewbox-content")
                            .css("width", w+"px")
                            .css("height", h+"px")
                            .html(data);
                    jQuery(".xpro-previewbox").fadeIn('slow', function() {
                        if(me.opt.showCallback) me.opt.showCallback();
                    });
                    me.invalidate();
                });
                jQuery('.xpro-previewbox').hide();
                jQuery('.xpro-previewbox-container').fadeIn('slow');
            }
        }

    };

    this.hide = function() {
        jQuery(".xpro-previewbox-container").fadeOut('slow', function() {
            jQuery(".xpro-previewbox-content").html("");
            if(me.opt.closeCallback) me.opt.closeCallback();
        });
    };

    this.setContent = function(html) {
        jQuery('.xpro-previewbox-content').html(html);
    };

    this.invalidate = function() {

        jQuery(".xpro-previewbox-container")
                .height(jQuery(window).height())
                .width(jQuery(window).width());

        jQuery('.xpro-previewbox')
                .css('left', (jQuery(window).width() - jQuery('.xpro-previewbox').width())/2 + "px")
                .css('top', (jQuery(window).height() - jQuery('.xpro-previewbox').height())/2 + "px");

    };

    this.init = (function () {
        if(!jQuery(".xpro-previewbox-container").length) {
            var html = [];
            html.push("<div class='xpro-previewbox-container'>");
            html.push("<div class='xpro-previewbox'><div class='xpro-previewbox-close xpro-slider-css-animate'><span class='xpro-slider-icon'></span></div><div class='xpro-previewbox-wrapper'><div class='xpro-previewbox-content'></div></div></div>");
            html.push("</div>");
            jQuery(html.join("")).appendTo(jQuery(document.body)).hide();
        }

        jQuery(".xpro-previewbox-container")
                .height(jQuery(window).height())
                .width(jQuery(window).width());

        jQuery(".xpro-previewbox-close").on("click", function() {
            me.hide();
        }).on("mouseover", function() {
            jQuery(this).addClass("xpro-previewbox-close-hover");
        }).on("mouseout", function() {
            jQuery(this).removeClass("xpro-previewbox-close-hover");
        });

        jQuery(".xpro-previewbox-container").on("click", function() {
            me.hide();
        });

        jQuery(window).on("resize", function() {
            me.invalidate();
        });

    })();

};
