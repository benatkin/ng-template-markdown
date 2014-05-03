(function() {

var app = angular.module('template-markdown', []);

app.factory('parseMarkdown', function() {
  var spanRegex = /\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\(\S+\)/;

  function parseInsideBlock(markdownText) {
    var spans = [];
    var str = markdownText;
    var match;
    var special;
    var end;
    for (var i=0; i < 1000; i++) {
      match = str.match(spanRegex);
      if (match) {
        end = match.index + match[0].length;
        spans.push({type: 'normal', text: str.substring(0, match.index)});
        special = match[0];
        if (special.substring(0, 2) == '**') {
          spans.push({type: 'bold', text: special.substring(2, special.length - 2)});
        } else if (special.substring(0, 1) == '*') {
          spans.push({type: 'italic', text: special.substring(1, special.length - 1)});
        } else {
          spans.push({
            type: 'link',
            text: special.substring(1, special.indexOf('](')),
            href: special.substring(special.indexOf('](') + 2, special.length - 1)
          });
        }
        str = str.substring(end);
      } else {
        spans.push({type: 'normal', text: str});
        break;
      }
    }
    return spans;
  }

  function parseBlock(markdownText) {
    var block = {};
    var header = markdownText.match(/^[#]+\s/);
    var lines = markdownText.split("\n");
    if (header !== null && typeof header !== 'undefined') {
      block.type = {'# ': 'h1', '## ': 'h2'}[header.toString()];
      block.spans = parseInsideBlock(markdownText.slice(header.toString().length));
    } else if (markdownText.substring(0, 2) == '* ') {
      block.type = 'list';
      block.items = [];
      var text = '';
      angular.forEach(lines, function(line) {
        if (line.substring(0, 2) == '* ') {
          if (text != '') {
            block.items.push({
              type: 'listItem',
              spans: parseInsideBlock(text)
            });
          }
          text = line.substring(2);
        } else {
          text += "\n" + line;
        }
      });
      if (text != '') {
        block.items.push({
          type: 'listItem',
          spans: parseInsideBlock(text)
        });
      }
    } else if (markdownText.trim() == '---') {
      block.type = 'hr';
    } else {
      block.type = 'para';
      block.spans = parseInsideBlock(markdownText);
    }
    return block;
  }

  function parseMarkdown(markdownText) {
    var blocks = [];
    if (markdownText.trim().length > 0) {
      var sections = markdownText.split("\n\n");
      blocks = sections.map(parseBlock);
    }
    return blocks;
  }

  return parseMarkdown;
});

app.controller('TemplateMarkdownCtrl', function($scope, $http, parseMarkdown) {
  $scope.text = '';
  $scope.blocks = [];

  $scope.$watch('text', function(newValue, oldValue) {
    $scope.blocks = parseMarkdown(newValue);
  });

  $http.get('/example.md').success(function(data) {
    $scope.text = data;
  });
});

})();
