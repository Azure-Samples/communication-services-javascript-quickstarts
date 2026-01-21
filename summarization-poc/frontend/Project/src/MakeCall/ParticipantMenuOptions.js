import * as React from 'react';
import { DefaultButton } from '@fluentui/react/lib/Button';
export const ParticipantMenuOptions = ({id, appendMenuitems, menuOptionsHandler, menuOptionsState}) => {

    const emojiIcon= { iconName: 'More' };
    const isSpotlighted = menuOptionsState.isSpotlighted;

    const buttonStyles = {
        root: {
          minWidth: 0,
          padding: '10px 4px',
          alignSelf: 'stretch',
          fontSize: '30px',
        }
    }
    
    let commonMenuItems = [
    ]


    const menuProps = {
        shouldFocusOnMount: true,
        items: appendMenuitems ? [...commonMenuItems, ...appendMenuitems]: commonMenuItems
    };
  return <DefaultButton 
            styles={buttonStyles}  
            menuIconProps={emojiIcon} 
            menuProps={menuProps} 
            className= {isSpotlighted ? "callFeatureEnabled participantMenu" : 'participantMenu' }
            title='More Options'
            hidden={true} />;
};
