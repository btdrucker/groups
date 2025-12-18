import React from 'react';
import IconButton from '../../common/IconButton';
import commonStyles from '../../common/style.module.css';

interface StatsHeaderProps {
    onBack: () => void;
    onRefresh: () => void;
}

const StatsHeader = ({onBack, onRefresh}: StatsHeaderProps) => {
    return (
        <div className={commonStyles.headerSticky}>
            <div className={commonStyles.headerContent}>
                <IconButton onClick={onBack} icon="fa-arrow-left">
                    Back
                </IconButton>
                <IconButton onClick={onRefresh} icon="fa-arrows-rotate">
                    <span className={commonStyles.hideOnMobile}>Refresh</span>
                </IconButton>
            </div>
        </div>
    );
};

export default StatsHeader;
