import React from "react";
import { Icon } from '@fluentui/react/lib/Icon';
import { Dropdown } from 'office-ui-fabric-react/lib/Dropdown';

export default class StarRating extends React.Component {
    constructor(props) {
        super(props);
        this.category = props.category;
        this.onRate = props.onRate;
        this.onIssueSelected = props.onIssueSelected;
        const issues = props.issues.map(issue => {
            const text = issue.replace(/([A-Z])/g, ' $1').trim();
            return { key: issue, text: text };
        });
        this.state = {
            currentScore: 0,
            selectedIssue: '',
            issues: issues
        };
    }

    componentWillUnmount() {

    }

    componentDidMount() {

    }

    rate(rating) {
        this.props.onRate(this.props.category, rating);
        this.setState({ currentScore: rating });
    }

    issueSelected = async (event, item) => {
        this.props.onIssueSelected(this.props.category, item.key);
        this.setState({ selectedIssue: item.key });
    };

    render() {
        return (
            <div className="ms-Grid" dir="ltr">
                <div className="ms-Grid-row">
                    <div className="ms-Grid-col ms-sm6">
                        <div className="text-center">
                            {[1, 2, 3, 4, 5].map(v =>
                                <span className="in-call-button"
                                    key={v}
                                    title={v}
                                    variant="secondary"
                                    onClick={() => this.rate(v)}>
                                    <Icon iconName={`${this.state.currentScore >= v ? 'FavoriteStarFill' : 'FavoriteStar'}`} />
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="ms-Grid-col ms-sm6">

                        <Dropdown
                            selectedKey={this.state.selectedIssue}
                            onChange={this.issueSelected}
                            label={'Issues'}
                            options={this.state.issues}
                            placeHolder={'No issues'}
                            styles={{ dropdown: { width: 400 } }}
                        />
                    </div>
                </div>
            </div>

        );
    }
}
