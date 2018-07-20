import React from 'react'
import PT from 'prop-types'
import _ from 'lodash'
import moment from 'moment'
import cn from 'classnames'

import MilestonePostSpecification from '../../MilestonePostSpecification'
import Form from '../../Form'
import MilestonePostMessage from '../../MilestonePostMessage'
import ProjectProgress from '../../../ProjectProgress'
import LinkRow from '../../LinkRow'
import WinnerSelectionBar from '../../WinnerSelectionBar'

import {
  MILESTONE_STATUS,
  MIN_WINNER_DESIGNS,
} from '../../../../../../config/constants'

import './MilestoneTypeFinalDesigns.scss'

class MilestoneTypeFinalDesigns extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      selectedLinks: [],
      places: [-1, -1, -1],
      isInReview: false,
      isAddingNewLink: false,
      isShowExtensionRequestMessage: false,
      isShowExtensionConfirmMessage: false,
      isShowCompleteConfirmMessage: false,
      isShowCustomerCompleteConfirmMessage: false,
    }

    this.updatedUrl = this.updatedUrl.bind(this)
    this.removeUrl = this.removeUrl.bind(this)
    this.showCompleteReviewConfirmation = this.showCompleteReviewConfirmation.bind(this)
    this.hideCompleteReviewConfirmation = this.hideCompleteReviewConfirmation.bind(this)
    this.showCustomerCompleteReviewConfirmation = this.showCustomerCompleteReviewConfirmation.bind(this)
    this.hideCustomerCompleteReviewConfirmation = this.hideCustomerCompleteReviewConfirmation.bind(this)
    this.completeReview = this.completeReview.bind(this)
    this.addDesignLink = this.addDesignLink.bind(this)
    this.cancelAddingLink = this.cancelAddingLink.bind(this)
    this.showExtensionRequestMessage = this.showExtensionRequestMessage.bind(this)
    this.hideExtensionRequestMessage = this.hideExtensionRequestMessage.bind(this)
    this.requestExtension = this.requestExtension.bind(this)
    this.approveExtension = this.approveExtension.bind(this)
    this.declineExtension = this.declineExtension.bind(this)
    this.moveToReviewingState = this.moveToReviewingState.bind(this)
    this.onBonusChange = this.onBonusChange.bind(this)
    this.onPlaceChange = this.onPlaceChange.bind(this)
  }

  showCompleteReviewConfirmation() {
    const { places } = this.state
    const minSelectedDesigns = this.getMinSelectedDesigns()

    if (places.filter((place) => place > -1).length < minSelectedDesigns) {
      this.setState({ isSelectWarningVisible: true })
    } else {
      this.setState({ isShowCompleteConfirmMessage: true })
    }
  }

  hideCompleteReviewConfirmation() {
    this.setState({ isShowCompleteConfirmMessage: false })
  }

  showCustomerCompleteReviewConfirmation() {
    const { places } = this.state
    const minSelectedDesigns = this.getMinSelectedDesigns()

    if (places.filter((place) => place > -1).length < minSelectedDesigns) {
      this.setState({ isSelectWarningVisible: true })
    } else {
      this.setState({ isShowCustomerCompleteConfirmMessage: true })
    }
  }

  hideCustomerCompleteReviewConfirmation() {
    this.setState({ isShowCustomerCompleteConfirmMessage: false })
  }

  completeReview() {
    const { milestone, completeMilestone } = this.props
    const { places, selectedLinks } = this.state
    const minSelectedDesigns = this.getMinSelectedDesigns()
    const links = _.get(milestone, 'details.content.links', [])

    if (places.filter((place) => place > -1).length < minSelectedDesigns) {
      this.setState({ isSelectWarningVisible: true })
      return
    }

    // when we change status to completed, we also save which links were selected
    completeMilestone({
      details: {
        ...milestone.details,
        content: {
          ..._.get(milestone, 'details.content', {}),
          links: links.map((link, index) => ({
            ...link,
            isSelected: _.includes(selectedLinks, index),
            selectedPlace: places.indexOf(index) + 1,
          })).sort((link1, link2) => (
            !!link1.selectedPlace && !link2.selectedPlace && -1 ||
            !link1.selectedPlace && !!link2.selectedPlace && 1 ||
            !!link1.selectedPlace && !!link2.selectedPlace && (link1.selectedPlace - link2.selectedPlace) ||
            !!link1.isSelected && !link2.isSelected && -1 ||
            !link1.isSelected && !!link2.isSelected && 1 ||
            0
          ))
        }
      }
    })
  }

  getMinSelectedDesigns() {
    const { milestone } = this.props
    const links = _.get(milestone, 'details.content.links', [])

    return Math.min(links.length, MIN_WINNER_DESIGNS)
  }

  /**
   * add design link
   */
  addDesignLink() {
    this.setState({ isAddingNewLink: true })
  }

  /**
   * cancel adding link
   */
  cancelAddingLink() {
    this.setState({ isAddingNewLink: false })
  }

  showExtensionRequestMessage() {
    this.setState({ isShowExtensionRequestMessage: true })
  }

  hideExtensionRequestMessage() {
    this.setState({ isShowExtensionRequestMessage: false })
  }

  requestExtension(value) {
    const { updateMilestoneContent } = this.props

    const extensionDuration = parseInt(value, 10)

    updateMilestoneContent({
      extensionRequest: {
        duration: extensionDuration,
        isDeclined: false,
        isApproved: false,
      }
    })
  }

  declineExtension() {
    const { updateMilestoneContent, milestone } = this.props
    const extensionRequest = _.get(milestone, 'details.content.extensionRequest')

    updateMilestoneContent({
      extensionRequest: {
        ...extensionRequest,
        isDeclined: true,
        isApproved: false,
      }
    })
  }

  approveExtension() {
    const { extendMilestone, milestone } = this.props
    const content = _.get(milestone, 'details.content')
    const extensionRequest = _.get(milestone, 'details.content.extensionRequest')

    extendMilestone(extensionRequest.duration, {
      details: {
        ...milestone.details,
        content: {
          ...content,
          extensionRequest: {
            ...extensionRequest,
            isApproved: true,
            isDeclined: false,
          }
        }
      }
    })
  }

  updatedUrl(values, linkIndex) {
    const { milestone, updateMilestoneContent } = this.props

    const links = [..._.get(milestone, 'details.content.links', [])]

    values.type = 'marvelapp'

    if (typeof linkIndex === 'number') {
      links.splice(linkIndex, 1, values)
    } else {
      links.push(values)
    }

    updateMilestoneContent({
      links
    })
  }

  removeUrl(linkIndex) {
    if (!window.confirm('Are you sure you want to remove this link?')) {
      return
    }

    const { milestone, updateMilestoneContent } = this.props
    const links = [..._.get(milestone, 'details.content.links', [])]

    links.splice(linkIndex, 1)

    updateMilestoneContent({
      links
    })
  }

  moveToReviewingState() {
    const { updateMilestoneContent } = this.props

    updateMilestoneContent({
      isInReview: true,
    })
  }

  onBonusChange(linkIndex, isSelected) {
    const { selectedLinks } = this.state

    if (isSelected) {
      this.setState({
        selectedLinks: [...selectedLinks, linkIndex],
      })
    } else {
      this.setState({
        selectedLinks: _.filter(selectedLinks, (selectedLinkIndex) =>
          selectedLinkIndex !== linkIndex
        )
      })
    }
  }

  onPlaceChange(linkIndex, place, isSelected) {
    const { places } = this.state
    let newPlaces = [...places]

    if (isSelected) {
      // remove link from the place if have some
      newPlaces = newPlaces.map((index) => linkIndex === index ? -1 : index)
      // put to the new place
      newPlaces.splice(place - 1, 1, linkIndex)
    } else {
      newPlaces.splice(place - 1, 1, -1)
    }

    this.setState({
      places: newPlaces,
    })
  }

  render() {
    const {
      milestone,
      theme,
      currentUser,
    } = this.props
    const {
      selectedLinks,
      isAddingNewLink,
      isSelectWarningVisible,
      isShowCustomerCompleteConfirmMessage,
      isShowExtensionRequestMessage,
      isShowCompleteConfirmMessage,
      isShowExtensionConfirmMessage,
      places,
    } = this.state

    const links = _.get(milestone, 'details.content.links', [])
    const isInReview = _.get(milestone, 'details.content.isInReview', false)
    const extensionRequest = _.get(milestone, 'details.content.extensionRequest')

    const isActive = milestone.status === MILESTONE_STATUS.ACTIVE
    const isCompleted = milestone.status === MILESTONE_STATUS.COMPLETED
    const minCheckedDesigns = this.getMinSelectedDesigns()

    const endDate = moment(milestone.endDate)
    const startDate = moment(milestone.startDate)
    const daysLeft = endDate.diff(moment(), 'days')
    const hoursLeft = endDate.diff(moment(), 'hours')
    const totalDays = endDate.diff(startDate, 'days')

    const progressText = daysLeft >= 0
      ? `${daysLeft} days until designs are completed`
      : `${daysLeft} days designs are delayed`

    const progressPercent = daysLeft > 0
      ? (totalDays - daysLeft) / totalDays * 100
      : 100

    return (
      <div
        styleName={cn('milestone-post-specification', theme, {
          completed: isCompleted,
          'in-progress': isActive
        })}
      >
        {/*
          Active status
         */}
        {isActive && (
          <div>
            {/* <span styleName="dot" /> */}

            {!isInReview &&  (
              <div styleName="separation-sm">
                <ProjectProgress
                  labelDayStatus={progressText}
                  progressPercent={progressPercent}
                  theme="light"
                  readyForReview
                >
                  {!currentUser.isCustomer && (
                    <button
                      onClick={this.moveToReviewingState}
                      className="tc-btn tc-btn-primary"
                      disabled={links.length === 0}
                    >
                      Ready for review
                    </button>
                  )}
                </ProjectProgress>
              </div>)
            }

            {isInReview && (
              <header styleName="milestone-heading">
                Select the top {minCheckedDesigns} winning designs
              </header>)
            }

            {!isInReview && !currentUser.isCustomer && links.map((link, index) => (
              <div styleName="content-link-wrap separation-sm" key={index}>
                <div styleName="add-specification-wrap separation-sm">
                  <LinkRow
                    itemId={index}
                    milestonePostLink={link.url}
                    milestonePostTitle={link.title}
                    milestoneType={link.type}
                    deletePost={this.removeUrl}
                    updatePost={this.updatedUrl}
                  />
                </div>
              </div>
            ))}

            {isInReview && links.map((link, index) => (
              <div styleName="content-link-wrap separation-sm" key={index}>
                <div styleName="add-specification-wrap separation-sm">
                  <WinnerSelectionBar
                    label={link.title}
                    link={link.url}
                    type={link.type}
                    index={index}
                    onPlaceChange={this.onPlaceChange}
                    onBonusChange={this.onBonusChange}
                    isSelectedBonus={_.includes(selectedLinks, index)}
                    selectedPlace={places.indexOf(index) + 1}
                    placesChosen={places}
                  />
                </div>
              </div>
            ))}

            {isAddingNewLink && (
              <div styleName="separation-sm">
                <Form
                  label="New design link"
                  maxTitle={64}
                  defaultValues={{
                    title: `Design ${links.length + 1}`,
                    url: '',
                  }}
                  okButtonTitle={'Add link'}
                  callbackCancel={this.cancelAddingLink}
                  callbackOK={this.updatedUrl}
                />
              </div>
            )}

            {!currentUser.isCustomer && !isInReview && !isAddingNewLink && (
              <div styleName="separation-sm">
                <MilestonePostSpecification
                  label={'Add a design link'}
                  fakeName={`Design ${links.length + 1}`}
                  onClick={this.addDesignLink}
                />
              </div>
            )}

            {isShowExtensionRequestMessage && (
              <div styleName="separation-sm">
                <MilestonePostMessage
                  label={'Milestone extension request'}
                  backgroundColor={'#FFF4F4'}
                  message={'Be careful, requesting extensions will change the project overall milestone. Proceed with caution and only if there are not enough submissions to satisfy our delivery policy.'}
                  isShowSelection
                  buttons={[
                    { title: 'Cancel', onClick: this.hideExtensionRequestMessage, type: 'default' },
                    { title: 'Request extension', onClick: this.requestExtension, type: 'warning' },
                  ]}
                />
              </div>
            )}

            {
              !!extensionRequest &&
              !extensionRequest.isApproved &&
              !extensionRequest.isDeclined &&
            (
              <div styleName="separation-sm">
                <MilestonePostMessage
                  label={'Milestone extension requested'}
                  backgroundColor={'#CEE6FF'}
                  message={`Due to unusually high load on our network we had less than the minimum number or design submissions. In order to provide you with the appropriate number of design options we’ll have to extend the milestone with ${extensionRequest.duration * 24}h. This time would be enough to increase the capacity and make sure your project is successful.<br /><br />Please make a decision in the next 24h. After that we will automatically extend the project to make sure we deliver success to you.`}
                  buttons={[
                    { title: 'Decline extension', onClick: this.declineExtension, type: 'warning' },
                    { title: 'Approve extension', onClick: this.approveExtension, type: 'primary' },
                  ]}
                />
              </div>
            )}

            {isShowCompleteConfirmMessage && (
              <div styleName="separation-sm">
                <MilestonePostMessage
                  label={'Complete milestone review'}
                  backgroundColor={'#FFF4F4'}
                  message={'Warning! Complete the review only if you have the permission from the customer. We do not want to close the review early without the ability to get feedback from our customers and let them select the winning 5 designs for next round.'}
                  isShowSelection={false}
                  buttons={[
                    { title: 'Cancel', onClick: this.hideCompleteReviewConfirmation, type: 'default' },
                    { title: 'Complete review', onClick: this.completeReview, type: 'warning' },
                  ]}
                />
              </div>
            )}

            {isShowCustomerCompleteConfirmMessage && (
              <div styleName="separation-sm">
                <MilestonePostMessage
                  label="Design phase competition"
                  backgroundColor={'#CEE6FF'}
                  message="This selection is final and cannot be undone. Once you confirm your selection we will close the design phase and can proceed to the next one. Clicking on the Confirm selection button would make the source files available for download."
                  isShowSelection={false}
                  buttons={[
                    { title: 'Cancel', onClick: this.hideCustomerCompleteReviewConfirmation, type: 'default' },
                    { title: 'Complete selection', onClick: this.completeReview, type: 'primary' },
                  ]}
                />
              </div>
            )}

            {isSelectWarningVisible && (
              <div styleName="message-bar hide-progress-bar" className="flex center">
                <i>Please select all {minCheckedDesigns} places to complete the review</i>
              </div>
            )}

            {
              !isCompleted &&
              !isShowExtensionRequestMessage &&
              !isShowExtensionConfirmMessage &&
              !isShowCompleteConfirmMessage &&
              !isShowCustomerCompleteConfirmMessage &&
            (
              <div styleName="action-bar hide-progress-bar" className="flex center">
                {(!currentUser.isCustomer || isInReview) && (
                  <button
                    className={'tc-btn tc-btn-primary'}
                    onClick={!currentUser.isCustomer ? this.showCompleteReviewConfirmation : this.showCustomerCompleteReviewConfirmation}
                    disabled={!isInReview}
                  >
                    Complete review ({
                      daysLeft >= 0
                        ? `${hoursLeft}h remaining`
                        : `${-daysLeft}h delay`
                    })
                  </button>
                )}
                {!currentUser.isCustomer && !extensionRequest && (
                  <button
                    className={'tc-btn tc-btn-warning'}
                    onClick={this.showExtensionRequestMessage}
                  >
                    Request Extension
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/*
          Completed status
         */}
        {isCompleted && (
          <div>
            <header styleName={'milestone-heading selected-theme separation-sm'}>
              Final designs
            </header>

            {links.filter((link) => (link.selectedPlace || link.isSelected)).map((link, index) => (
              <div styleName="content-link-wrap separation-sm" key={index}>
                <div styleName="add-specification-wrap separation-sm">
                  <WinnerSelectionBar
                    label={link.title}
                    link={link.url}
                    type={link.type}
                    isSelectedBonus={link.isSelected}
                    selectedPlace={link.selectedPlace}
                    placesChosen={places}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
}

MilestoneTypeFinalDesigns.defaultProps = {
}

MilestoneTypeFinalDesigns.propTypes = {
  progressPercent: PT.string,
  labelDayStatus: PT.string,
  labelSpent: PT.string,
  labelStatus: PT.string,
  isCompleted: PT.bool,
  inProgress: PT.bool,
}

export default MilestoneTypeFinalDesigns
