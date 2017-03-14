var Сonstant = function(a, c, m) {
    this.a = a;
    this.c = c;
    this.m = m;
}
var firstConst = new Сonstant(16807, 278788, 2147483647);
var doubleConst = new Сonstant(1444, 24575, 154572547);
$(document).ready(function() {
    var ipx = [];
    var ipy = [];
    var ipms = [];
    var ipdate = [];
    var timeResolution = 10;
    var xResolution = 1;
    var yResolution = 1;
    var saveInterval = 10000;
    var maxTrackStringLength = 10000; //200000
    var trackString = '';
    var lastFrame = {
        id: null,
        x: null,
        y: null
    }
    var HEIGHT = 960,
        WIDTH = 1440;

    function random(min, max) {
        return Math.round((Math.random() * max - min) + min);
    }

    function star_field(context, star_number) {
        var x,
            y,
            brightness,
            radius;
        context.fillStyle = "#fff";
        context.fillRect(0, 0, WIDTH, HEIGHT);
        context.save();

        for (var i = 0, j = 0; i < ipx.length, j < ipy.length; i++, j++) {
            x = ipx[i];
            y = ipy[i];
            radius = 2;
            context.beginPath();
            context.fillStyle = 'black';
            context.arc(x, y, radius, 0, Math.PI * 2, true);
            context.fill();
            context.closePath();
        }
        context.restore();
    }

    function init() {
        var canvas = document.getElementsByTagName('canvas')[0],
            context = canvas.getContext('2d');

        canvas.width = WIDTH;
        canvas.height = HEIGHT;

        star_field(context, 300);
    }

    $('#printer').on('click', function() {
        init();
    });

    function makeClass() {
        return function(args) {
            if ('undefined' == typeof args) {
                args = {};
            }
            if (this instanceof arguments.callee) {
                if (typeof this.init == "function")
                    this.init.apply(this, args.callee ? args : arguments);
            } else
                return new arguments.callee(arguments);
        };
    }
    var MouseShowSubscriber = makeClass();
    $.extend(MouseShowSubscriber.prototype, {
        update: function(eventData) {
            $('#x-holder').html(eventData.x);
            $('#y-holder').html(eventData.y);
            $('#rtime').html(eventData.ms);
        },
    });



    $('#starting').on('click', function() {
        // document.getElementById('is_start').innerHTML = 'Запись координат в процессе'
        var SettingsTrait = {
            init: function(settings) {
                this.setup(settings);
            },
            settings: {
                debug: false
            },
            setup: function(settings) {
                for (var e in settings) {
                    6
                    this.settings[e] = settings[e];
                }
            },
            debugLog: function(msg) {
                if (this.settings.debug && window.console) {
                    console.log(msg);
                }
            },
            end: null
        };
        var autoIncrement = 0;
        var subscribers = {};
        var PublisherTrait = {
            addSubscriber: function(subscriber, key) {
                if ('undefined' == typeof key) {
                    key = autoIncrement++;
                }
                if ('function' == typeof subscriber.update) {
                    subscribers[key] = subscriber;
                }
                return this;
            },
            publish: function(eventData) {
                for (var e in subscribers) {
                    subscribers[e].update(eventData);
                }
                return this;
            },
            end: null
        };
        var MousePublisher = makeClass();
        var dateStart = null;
        var listenerName = 'mousepublisher';
        $.extend(MousePublisher.prototype, SettingsTrait, PublisherTrait, {
            init: function(settings) {
                this.setup(settings);
                dateStart = new Date();
                this.startListening();
            },
            startListening: function() {
                this.debugLog('starting listening');
                (function(obj) {
                    $(document).bind('mousemove.' + listenerName,
                        function(e) {
                            obj.setEvent(e);
                        }
                    );
                })(this);
                return this;
            },
            setEvent: function(e) {
                this.publish({
                    x: e.pageX,
                    y: e.pageY,
                    ms: new Date().getTime() - dateStart.getTime()
                });
            },
            end: null
        });
        var MouseTrackSubscriber = makeClass();

        $.extend(MouseTrackSubscriber.prototype, SettingsTrait, {
            init: function(settings) {
                this.setup(settings);
            },
            saveTrack: function() {
                // this.debugLog('saving track');
                // document.getElementById('is_start').innerHTML = '';
                // document.getElementById('is_finish').innerHTML = 'Запись координат закончена'
                // this.debugLog(trackString);
                if (!trackString && !this.settings.saveEmpty) {
                    return this;
                }
                return this;
            },
            update: function(eventData) {
                var frameId = Math.floor(eventData.ms / timeResolution);
                if (frameId == lastFrame.id) {
                    return;
                }
                if (xResolution > 1) {
                    eventData.x = Math.floor(Math.floor(eventData.x / xResolution) * xResolution);
                }
                if (yResolution > 1) {
                    eventData.y = Math.floor(Math.floor(eventData.y / yResolution) * yResolution);
                }
                if (lastFrame.id && lastFrame.x == eventData.x && lastFrame.y == eventData.y) {
                    return;
                }
                this.addTrack(frameId, eventData.x, eventData.y, eventData.ms); //eventData.ms
            },
            addTrack: function(frameId, x, y, ms, time) {
                var time = get10Date();
                // this.debugLog('id: ' + frameId + ' x: ' + x + ' y: ' + y + ' ms: ' + ms + ' time: ' + time);
                $('#coordX').append(x);
                $('#coordY').append(y);
                $('#memory').append(transfer10to2(x) + ' ' + transfer10to2(y) + ' ');
                var delta = '' + frameId + ',' + x + ',' + y + ',' + ms + ';';
                if (trackString.length + delta.length > maxTrackStringLength) {
                    this.saveTrack();
                    $(document).unbind('mousemove.' + listenerName);
                }
                trackString += delta;
                lastFrame = {
                    id: frameId,
                    x: x,
                    y: y,
                    ms: ms,
                    time: time
                };
                ipx.push(x);
                ipy.push(y);
                ipms.push(ms);
                ipdate.push(time);
                return this;
            },
            end: null
        });
        MousePublisher({
                debug: false
            })
            .addSubscriber(MouseTrackSubscriber({
                debug: true,
                saveInterval: 10000,
                timeResolution: 1,
                saveEmpty: false
            }))
            .addSubscriber(MouseShowSubscriber({
                xHolder: '#x-holder',
                yHolder: '#y-holder',
                msHolder: '#rtime'
            }));
    });

    $('#print').on('click', function(event) {
        for (var i = 0, j = 0; i < ipx.length, j < ipy.length; i++, j++) {
            addNode(ipx[i], ipy[j]);
        }
    });

    function transfer10to2(num) {
        var out = "",
            bit = 1;
        while (num >= bit) {
            out = (num & bit ? 1 : 0) + out;
            bit <<= 1;
        }
        return out || "0";
    }

    function transeft2to10(num) {
        var out = 0,
            len = num.length,
            bit = 1;
        while (len--) {
            out += num[len] == "1" ? bit : 0;
            bit <<= 1;
        }
        return out;
    }
    var seed = [];
    var iteration = 5; //Количество числе в последовательности
    var result = [];
    var predresult = [];
    var resLenght = 9;
    var prover = [];
    var miliseconds = 0.001 * 1000;
    var seconds = miliseconds * 1000; //1000
    var minute = seconds * 60; //60000
    var hour = minute * 60; //3600000
    var day = hour * 24; //86400000

    function get10Date() {
        var today = new Date();
        var todayTime = today.getTime();
        var dayAgoToday = new Date("10/20/2016");
        var dayAgoTime = dayAgoToday.getTime();
        return Math.round(todayTime / miliseconds) - Math.round(dayAgoTime / miliseconds)
    }

    function gen(seed, consts) {
        return (consts.a * seed + consts.c) % consts.m;
    }

    function input(arr, x, y, date) {
        var qwe = arr.push(Math.round((x * date) + (y * date)));
        return qwe
    }
    $('#mouse_rand').on('click', function() {
        predresult = [];
        for (var i = 0, j = 0, k = 0; i < ipx.length, j < ipy.length, k < ipdate.length; i++, j++, k++) {
            input(predresult, ipx[i], ipy[j], ipdate[k])
        }
        console.log(predresult)
    });
    $('#prng_mouse').on('click', function() {
        predresult = [];
        for (var i = 0, j = 0, k = 0; i < ipx.length, j < ipy.length, k < ipdate.length; i++, j++, k++) {
            input(predresult, ipx[i], ipy[j], ipdate[k])
        }
        for (var i = 0; i < predresult.length; i++) {
            result.push(gen(predresult[i], firstConst));
        }
        for (var i = 0; i < result.length; i++) {
            $('#result').append(result[i] + ' ')
        }
        console.log(result);
        odinakovie(result)
    });
    $('#default').on('click', function() {

    })
    $('#noise_ms').on('click', function() {
        console.time("Execution time took");
        var qwerty = [];
        new Element('style', {
            type: 'text/css'
        }).inject(document.head);

        var stylesheet = document.styleSheets[document.styleSheets.length - 1],
            canvas = new Element('canvas'),
            ctx = (canvas.getContext) ? canvas.getContext('2d') : null,
            generateRule = function(selector, dataURL) {
                return selector + ' { background-image:url(' + dataURL + '); }';
            };
        var Noise = window.Noise = new Class({

            Implements: Options,

            options: {
                selector: '.noise',
                width: 700,
                height: 700,
                opacityClamp: 1.0,
                color: 'rgba(0,0,0,|)',
                imageType: 'image/png'
            },
            initialize: function(options) {
                if (!ctx) return null;

                this.setOptions(options);

                var opts = this.options,
                    el = document.id(opts.selector),
                    oc = opts.opacityClamp * 100,
                    colorStart = opts.color.split('|')[0],
                    colorEnd = opts.color.split('|')[1],
                    rLen = opts.height,
                    cLen = opts.width,
                    r, c, o;

                canvas.set('width', opts.width);
                canvas.set('height', opts.height);
                ctx.clearRect(0, 0, opts.width, opts.height);
                var w = randomQ(1, oc);
                for (r = 0; r < rLen; r++) {
                    for (c = 0; c < cLen; c++) {
                        o = randomQ(1, 100) / w; // o = Number.random(0, oc) / w;
                        ctx.fillStyle = colorStart + o + colorEnd;
                        ctx.fillRect(c, r, 1, 1);
                        qwerty.push(o);

                    }
                }
                if (el) el.setStyle('background-image', 'url(' + canvas.toDataURL(opts.imageType) + ')');
                else stylesheet.insertRule(generateRule(opts.selector, canvas.toDataURL(opts.imageType)), stylesheet.rules.length);
                document.getElementById('width_noise').innerHTML = opts.width;
                document.getElementById('height_noise').innerHTML = opts.height;
                document.getElementById('point_noise').innerHTML = opts.height * opts.width;
                document.getElementById('brightness_noise').innerHTML = sumArray(qwerty) / qwerty.length;
                return null;
            }
        });
        var sliceQwerty = [];
        setTimeout(function() {
            var start = 0;
            var end = 40;
            var count = 0;
            var result = 0;
            while (count < 10000) {
                sliceQwerty.push(qwerty.slice(start, end));
                start += 40;
                end += 40;
                count++;
            }
        }, 10);
        var rrrr = [];
        var result_noise = [];
        $(document).ready(function() {
            $('#qwert').on('click', function() {
                rrrr = [];
                for (var i = 0; i < sliceQwerty.length; i++) {

                    rrrr.push(arraySum(sliceQwerty[i]) * getaaDate());
                }
                result_noise = []
                for (var i = 0; i < rrrr.length; i++) {
                    result_noise.push(gen(rrrr[i], firstConst));
                }
                console.log(result_noise)
                odinakovie(result_noise)
                console.timeEnd("Execution time took");

            })
            var result_noise = [];
            $('#prng_noise').on('click', function() {
                result_noise = [];
                for (var i = 0; i < rrrr.length; i++) {
                    result_noise.push(gen(rrrr[i], firstConst));
                }
                console.log(result_noise)
                odinakovie(result_noise)
            });
        });

        function sumArray(array) {
            var sum = 0;
            for (var i = 0; i < array.length; i++) {
                sum += array[i];
            }
            return sum;
        }

        function arraySum(array) {
            var sum = 0;
            for (var i = 0; i < array.length; i++) {
                sum += array[i];
            }
            return Math.floor(sum * randomW(1, 50));
        }

        function randomQ(min, max) {
            return Math.round((Math.random() * max - min) + min);
        }

        function randomW(min, max) {
            return (Math.random() * max - min) + min;
        }

        new Noise({
            selector: '#noise1'
        });
    });

});
var miliseconds = 0.001 * 1000;
var seconds = miliseconds * 1000; //1000
var minute = seconds * 60; //60000
var hour = minute * 60; //3600000
var day = hour * 24; //86400000
function getaaDate() {
    var today = new Date();
    var todayTime = today.getTime();
    var dayAgoToday = new Date("10/20/2016");
    var dayAgoTime = dayAgoToday.getTime();
    return Math.round(todayTime / miliseconds) - Math.round(dayAgoTime / miliseconds)
}



var a = ["7", "54"],
    b = ["41", "44", "54", "99", "23"];

for (var i = 0; i <= a.length; i++) {
    for (var j = 0; j <= b.length; j++) {
        if (a[i] == b[j])
            console.log(a[i] == b[j]);
    }
}



var defRand = [];
var result_rand = [];
$('#getRandomDefault').on('click', function() {
    console.time("Execution time took");
    defRand = [];
    var minValue = 1,
        maxValue = 99999;
    for (var i = 0; i <= 10000; i++) {
        defRand.push(randomInteger(minValue, maxValue) * getaaDate()); //* getaaDate()
    }
    result_rand = [];
    for (var i = 0; i < defRand.length; i++) {
        result_rand.push(gen(defRand[i], firstConst));
    }
    console.log(result_rand);
    odinakovie(result_rand);
    console.timeEnd("Execution time took");
});

function gen(seed, consts) {
    return (consts.a * seed + consts.c) % consts.m;
}
$('#prng_rand').on('click', function() {
    result_rand = [];
    for (var i = 0; i < defRand.length; i++) {
        result_rand.push(gen(defRand[i], firstConst));
    }
    console.log(result_rand);
    odinakovie(result_rand);
});
$('#prng_rand_10').on('click', function() {
    defRand = [];
    var minValue = 1000,
        maxValue = 99999;
    for (var i = 0; i <= 10000; i++) {
        defRand.push(randomInteger(minValue, maxValue) * getaaDate()); //* getaaDate()
    }
    result_rand = [];
    for (var i = 0; i < defRand.length; i++) {
        result_rand.push(gen(defRand[i], firstConst));
    }
    odinakovie(result_rand);
    result_rand = [];
    for (var i = 0; i < defRand.length; i++) {
        result_rand.push(gen(defRand[i], firstConst));
    }
    console.log(result_rand);
    odinakovie(result_rand);
});



function randomInteger(min, max) {
    var rand = min + Math.random() * (max - min)
    rand = Math.round(rand);
    return rand;
}

function odinakovie(arr) {
    arr.sort(function(a, b) {
        return a - b;
    });
    for (var j = 0, i = 1; i < arr.length; i++) {
        if (arr[i - 1] === arr[i]) {
            arr.splice(i, 1);
            i--;
            j++;
        }
    }
    console.log('Найдено дубликатов - ' + j);
    return j;
}