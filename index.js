/**
 * Functions
 */
const parseIssueUrl = (url) => {
  const matches = url.toString().match(/^https:\/\/github\.com\/([^/]+\/[^/]+)\/(?:issues|pull)\/([\d]+)(?:#(issue(?:comment)?)-([\d]+))?/)
  return matches && matches[1] && matches[2]
    ? { repoName: matches[1], number: matches[2], linkType: matches[3], commentId: matches[4] }
    : null
}

const setTooltipAttributes = (elem, urlData, doc) => {
  if (urlData.linkType && urlData.commentId) {
    elem.setAttribute('data-tooltip', doc.querySelector(`#${urlData.linkType}-${urlData.commentId} .comment-body`).innerHTML)
  } else {
    elem.setAttribute('data-tooltip', doc.querySelector(`.comment .comment-body`).innerHTML)
  }
  elem.setAttribute('data-tooltip-stickto', 'top')
  elem.setAttribute('data-tooltip-maxwidth', '600px')
}

const createOnMouseoverHandler = (urlData, elem) => {
  return () => {
    elem.setAttribute('data-issue-comment-tooltip-mouseover', true)

    if (!elem.getAttribute('data-issue-comment-tooltip-fetching')) {
      elem.setAttribute('data-issue-comment-tooltip-fetching', true)

      const xhr = new XMLHttpRequest()

      xhr.onreadystatechange = function() {
        if (xhr.readyState == XMLHttpRequest.DONE) {
          if (xhr.status == 200) {
            setTooltipAttributes(elem, urlData, xhr.response)
            html5tooltips.refresh()
            if (elem.getAttribute('data-issue-comment-tooltip-mouseover') === 'true') {
              const tooltip = html5tooltips.getTooltipByTarget(elem)
              tooltip.mount()
              tooltip.show()
            } else {
              console.log('dont show tooltip')
            }
          }
        }
      }

      xhr.open('GET', elem.href, true)
      xhr.responseType = 'document'
      xhr.send()
    }
  }
}

const createOnMouseoutHandler = (elem) => {
  return () => {
    elem.setAttribute('data-issue-comment-tooltip-mouseover', false)
  }
}

/**
 * Start main logic
 */

const urlData = parseIssueUrl(location.toString())

if (urlData) {
  const repoName = urlData.repoName
  const issueNumber = urlData.number

  const isInnerLink = (link) => {
    const innerUrlData = parseIssueUrl(link)
    return innerUrlData && innerUrlData.repoName === repoName && innerUrlData.number === issueNumber
  }

  Array.from(document.querySelectorAll('.issue-link')).forEach((elem) => {
    const urlData = parseIssueUrl(elem.href)

    if (isInnerLink(elem.href)) {
      if (urlData.linkType === 'issue' || urlData.linkType === 'issuecomment') {
        setTooltipAttributes(elem, urlData, document)
      }
    } else {
      elem.addEventListener('mouseover', createOnMouseoverHandler(urlData, elem))
      elem.addEventListener('mouseout', createOnMouseoutHandler(elem))
    }
  })
}
