{
    var DomNodes = require('../../../lib/domnodes');
}

Content = nodes:Nodes {
    return new DomNodes.DocumentNode({
        childNodes: nodes
    });
}

Nodes = (DocType / Comment / Script / SelfClosingTag / BalancedTag  / Text)*

DocType = "<!doctype"i doctype:[^>]* ">" {
    return new DomNodes.Doctype({ data: doctype.join('')});
}

Comment = "<!--" c:(!"-->" c:. {return c})* "-->" {
    return new DomNodes.Comment({ data: c.join('') });
}

Script = "<script"i attributes:Attribute* " "* ">" c:(!"</script>" c:. {return c})* "</script>" {
    return new DomNodes.Tag({
        name: 'script',
        attributes: attributes,
        data: c.join('')
    });
}

Style = "<style"i attributes:Attribute* " "* ">" c:(!"</style>" c:. {return c})* "</style>" {
    return new DomNodes.Tag({
        name: 'style',
        attributes: attributes,
        data: c.join('')
    });
}
 
BalancedTag = startTag:StartTag childs:Nodes endTag:EndTag {
    if (startTag.name != endTag) {
        throw new Error("Expected </" + startTag.name + "> but </" + endTag + "> found. (" + line() + ":" + column() + ")");
    }
 
    return new DomNodes.Tag({
        name: startTag.name,
        attributes: startTag.attributes,
        childNodes: childs
    });
  }

SelfClosingTag = "<" name:TagName attributes:Attribute* " "* "/>" {
    return new DomNodes.Tag({
        name: name,
        attributes: attributes,
        childNodes: []
    });
}
 
StartTag = "<" name:TagName attributes:Attribute* " "* ">" {
  return { 
    name: name,
    attributes: attributes
  }
}
 
EndTag = "</" name:TagName ">" { return name; }

Attribute = " "* attribute:(ValuedAttribute / ValuelessAttribute) {
    return attribute;
}

ValuedAttribute = name:AttributeName "=" value:AttributeValue {
  return {
    name: name,
    value: value
  };
}

ValuelessAttribute = name:AttributeName {
  return {
    name: name,
    value: null
  };
}

AttributeName = chars:[a-zA-Z0-9\-\:]+ { return chars.join(''); }
AttributeValue = (QuotedAttributeValue / UnquotedAttributeValue)

QuotedAttributeValue = value:QuotedString { return value; }

UnquotedAttributeValue = value:decimalDigit* { return value.join(''); }
 
TagName = chars:[a-zA-Z0-9]+ { return chars.join(''); }

Text = chars:[^<]+  {
    return new DomNodes.Text({
        data: chars.join('')
    });
}



decimalDigit = [0-9]

QuotedString =
    '"' d:(stringData / "'")* '"' {
        return d.join('');
    } /
    "'" d:(stringData / '"')* "'" {
        return d.join('');
    }

stringData
    = [^"'\\]
    / "\\" c:. { c }

/*
QuotedString
  = "\"\"\"" d:(stringData / "'" / $("\"" "\""? !"\""))+ "\"\"\"" {
      return d.join('');
    }
  / "'''" d:(stringData / "\"" / "#" / $("'" "'"? !"'"))+ "'''" {
      return d.join('');
    }
  / "\"" d:(stringData / "'")* "\"" { return d.join(''); }
  / "'" d:(stringData / "\"" / "#")* "'" { return d.join(''); }
  stringData
    = [^"'\\#]
    / "\\0" !decimalDigit { '\0' }
    / "\\0" &decimalDigit { throw new SyntaxError ['string data'], 'octal escape sequence', offset(), line(), column() }
    / "\\b" { '\b' }
    / "\\t" { '\t' }
    / "\\n" { '\n' }
    / "\\v" { '\v' }
    / "\\f" { '\f' }
    / "\\r" { '\r' }
    / "\\" c:. { c }
    / c:"#" !"{" { c }
*/