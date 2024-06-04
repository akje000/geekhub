$(document).ready(function () {

    // 13(엔터)키를 이용해 검색버튼 클릭
    $('#search-input').keypress(function (e) {
        if (e.which == 13) {
            $('#search-button').click();
        }
    });

    $('#search-button').click(function () {
        // 입력된 검색어를 소문자로 변환하고 공백으로 나누어 배열로 저장, API URL 설정
        var searchValue = $('#search-input').val().toLowerCase().split(" ");
        var apiUrl = 'https://8jg2m15z61.execute-api.ap-northeast-2.amazonaws.com/7/0';

        // 신뢰도 슬라이더를 생성, 코드 88줄
        createConfidenceSliders();

        // API를 호출하고 데이터 가져오기
        $.get(apiUrl, function (data) {
            // 기존의 이미지 컨테이너 비우기
            $('#image-container').empty();
            $('#no-results-message').hide();

            var rowImages = [];

            // 레이블에 해당하는 이미지 경로를 가져옴
            for (var imagePath in data) {
                var labels = data[imagePath];
                // 검색값과 레이블의 배열 요소가 일치하는지 확인
                var containsAllLabels = searchValue.every(function (label) {
                    return labels.some(function (item) {
                        // 레이블이 일치하고 신뢰도 기본값 이상의 값을 갖는지 확인
                        return item.Label.toLowerCase() === label && parseFloat(item.Confidence) >= $('#confidence-' + label).val();
                    });
                });
                
                // 위 조건에 맞을 경우 imageUrl 생성
                if (containsAllLabels) {
                    var imageUrl = 'https://cdn.geek-hub.cloud/' + imagePath;

                    // 레이블 배열에서 검색값에 포함된 레이블과 신뢰도값을 기준으로 필터링 후 HTML형태로 변환
                    var labelInfo = labels
                        .filter(function (item) {
                            return searchValue.includes(item.Label.toLowerCase()) && parseFloat(item.Confidence) >= $('#confidence-' + item.Label.toLowerCase()).val();
                        })
                        .map(function (item) {
                            return `<p>${item.Label}: ${parseFloat(item.Confidence).toFixed(2)}</p>`;
                        })
                        .join('');
                    
                    // 필터링된 라벨 정보를 포함한 imageCard HTML을 생성
                    var imageCard = `
                    <div class="image-card">
                        <img src="${imageUrl}" alt="${imagePath}">
                        <div class="label-info">
                            ${labelInfo}
                        </div>
                    </div>
                    `;

                    // 만들어진 imageCard를 rowImages 배열
                    rowImages.push(imageCard);

                    // 배열의 길이가 2가 되면 새로운 이미지 행을 생성하고, #image-container에 추가, 마지막으로 배열 초기화
                    if (rowImages.length === 2) {
                        var row = $('<div class="image-row"></div>').appendTo('#image-container');
                        row.append(rowImages);
                        rowImages = [];
                    }
                }
            }

            // 루프가 끝난 후 남아있는 imageCard가 있다면 새로운 이미지 행 생성 후 추가
            if (rowImages.length > 0) {
                var row = $('<div class="image-row"></div>').appendTo('#image-container');
                row.append(rowImages);
            // 조건을 만족하는 이미지가 없다면 #no-results-message를 표시
            } else {
                $('#no-results-message').show();
            }
        });
    });

    // 사이드바 버튼 클릭시 사이드바가 250px크기로 열림
    $('#open-sidebar').click(function () {
        $('#sidebar').width('250px');
    });

    // 사이드바 버튼 클릭시 사이드바가 0px크기로 닫힘
    $('#close-sidebar').click(function () {
        $('#sidebar').width('0');
        // $('#confidence-sliders').empty(); // 사이드바 닫으면 슬라이더 지워짐
    });

    // applyFilter 함수 호출, 필터 역할
    $('#apply-filter').click(function () {
        applyFilter();
    });

    // 검색어에 해당하는 슬라이더 생성
    function createConfidenceSliders() {

        // 검색어를 개별 라벨로 나누기 위해 검색 입력 필드의 값을 소문자로 변환한 후 공백을 기준으로 분할하여 배열 searchValue생성
        var searchValue = $('#search-input').val().toLowerCase().split(" ");
        // 새로운 검색어에 맞춰 슬라이더를 다시 생성하기 위해 슬라이더 컨테이너를 초기화하여 이전에 생성된 슬라이더들을 제거
        $('#confidence-sliders').empty();
        // 슬라이더 생성
        searchValue.forEach(function (label) {
            var sliderHtml = `
            <div class="confidence-slider-container">
                <span class="confidence-value">(${label}): </span>
                <br>
                <input type="range" min="0" max="100" value="30" id="confidence-${label}">
                <span class="confidence-value"> 30%</span>
            </div>
            `;
            // HTML에 슬라이더 추가
            $('#confidence-sliders').append(sliderHtml);
            // 신뢰도 값을 실시간으로 표시
            $('#confidence-' + label).on('input', function () {
                var value = $(this).val();
                $(this).next('.confidence-value').text('  ' + value + '%');
            });
        });
    }

    // 검색어와 각 검색어에 대한 신뢰도 값을 수집하여, 이를 기반으로 필터링된 이미지를 표시하는 기능을 수행
    function applyFilter() {
        var searchValue = $('#search-input').val().toLowerCase().split(" ");
        // 빈 객체 confidenceValues를 생성
        var confidenceValues = {};
        // 해당 레이블에 대한 슬라이더 값을 가져와 객체 confidenceValues에 저장
        searchValue.forEach(function (label) {
            confidenceValues[label] = $('#confidence-' + label).val();
        });
        // 검색어와 신뢰도 값을 사용하여 필터링된 이미지 출력
        showFilteredImages(searchValue, confidenceValues);
    }

    // 상단의 $('#search-button').click(function ()와 같은 기능을 해 코드가 거의 똑같지만
    // 신뢰도의 슬라이더값에 해당하는 필터링된 이미지 출력
    function showFilteredImages(searchValue, confidenceValues) {

        var apiUrl = 'https://8jg2m15z61.execute-api.ap-northeast-2.amazonaws.com/7/0';

        $.get(apiUrl, function (data) {
            $('#image-container').empty();
            $('#no-results-message').hide();

            var rowImages = [];

            for (var imagePath in data) {
                var labels = data[imagePath];
                var containsAllLabels = searchValue.every(function (label) {
                    return labels.some(function (item) {
                        return item.Label.toLowerCase() === label && parseFloat(item.Confidence) >= confidenceValues[label];
                    });
                });

                if (containsAllLabels) {
                    var imageUrl = 'https://cdn.geek-hub.cloud/' + imagePath;

                    var labelInfo = labels
                        .filter(function (item) {
                            return searchValue.includes(item.Label.toLowerCase()) && parseFloat(item.Confidence) >= confidenceValues[item.Label.toLowerCase()];
                        })
                        .map(function (item) {
                            return `<p>${item.Label}: ${parseFloat(item.Confidence).toFixed(2)}</p>`;
                        })
                        .join('');

                    var imageCard = `
                              <div class="image-card">
                                <img src="${imageUrl}" alt="${imagePath}">
                                <div class="label-info">
                                  ${labelInfo}
                                </div>
                              </div>
                            `;

                    rowImages.push(imageCard);

                    if (rowImages.length === 2) {
                        var row = $('<div class="image-row"></div>').appendTo('#image-container');
                        row.append(rowImages);
                        rowImages = [];
                    }
                }
            }

            if (rowImages.length > 0) {
                var row = $('<div class="image-row"></div>').appendTo('#image-container');
                row.append(rowImages);
            } else {

                $('#no-results-message').show();
            }
        });
    }
    var apiUrl = 'https://8jg2m15z61.execute-api.ap-northeast-2.amazonaws.com/7/0';

    $.get(apiUrl, function (data) {
        $('#image-container').empty();
        $('#no-results-message').hide();

        var images = [];

        for (var imagePath in data) {
            var labels = data[imagePath];
            var imageUrl = 'https://cdn.geek-hub.cloud/' + imagePath;

            var labelInfo = labels.map(function (item) {
                return `<p>${item.Label}: ${parseFloat(item.Confidence).toFixed(2)}%</p>`;
            }).join('');

            var imageCard = `
                <div class="image-card">
                  <img src="${imageUrl}" alt="${imagePath}">
                  <!--<div class="label-info">${labelInfo}</div>-->
                </div>
                `;

            images.push(imageCard);
        }

        // 이미지 배열을 랜덤
        shuffleArray(images);

        // 섞인 이미지 배열을 화면에 출력
        for (var i = 0; i < images.length; i += 2) {
            var rowImages = images.slice(i, i + 2);
            var row = $('<div class="image-row"></div>').appendTo('#image-container');
            row.append(rowImages);
        }

        if (images.length === 0) {
            $('#no-results-message').show();
        }
    });

    // Fisher-Yates (Knuth) 셔플 알고리즘
    function shuffleArray(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    }

    // API에서 이미지를 가져와서 화면에 출력하는 기능, 중복돼서 주석
    // loadImages();

});

//처음 이미지를 100장을 나오게 수정하고 이후 이미지는 무한 스크롤을 통해 나오도록 수정
