import {
    ChartAreaStackedNormalized,
    Gear,
    LayoutList,
    Moon,
    Person,
    SquareBars,
    SquareChartBar,
    Sun,
} from '@gravity-ui/icons';
import {ActionBar, AsideHeader, FooterItem} from '@gravity-ui/navigation';
import {
    Breadcrumbs,
    Flex,
    Icon,
    PortalProvider,
    SegmentedRadioGroup,
    Theme,
    ThemeProvider,
} from '@gravity-ui/uikit';
import React, {Fragment, useState} from 'react';


import gravityUi from '../assets/gravity-ui.svg';
import {block} from './block';


import './PreviewLayout.scss';


const b = block('themes-preview-layout');

interface PreviewLayoutProps {
    id: string;
    breadCrumbsItems: string[];
    styles?: string;
    children: (props: {justify: 'flex-start'}) => React.ReactNode;
    hideAsideMenu?: boolean;
    scrollableContent?: boolean;
    noPadding?: boolean;
    initialTheme?: Theme;
    hideThemeToggle?: boolean;
}

export const PreviewLayout = ({
    breadCrumbsItems,
    children,
    styles,
    id,
    hideAsideMenu,
    scrollableContent,
    noPadding,
    initialTheme = 'dark',
    hideThemeToggle = false,
}: PreviewLayoutProps) => {
    const [theme, setTheme] = useState<Theme>(initialTheme);
    const justify = 'flex-start' as const;
    const [isCompact, setCompact] = useState<boolean>(true);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const onThemeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setTheme(event.target.value as 'light' | 'dark');
    };

    const renderContent = () => {
        return (
            <Fragment>
                <ActionBar aria-label="Actions bar">
                    <ActionBar.Section type="primary">
                        <ActionBar.Group pull="left-grow">
                            <Breadcrumbs showRoot className={b('breadcrumbs')}>
                                {['Gravity UI', ...breadCrumbsItems].map((item, index) => (
                                    <Breadcrumbs.Item key={`${index}-${item}`}>
                                        {item}
                                    </Breadcrumbs.Item>
                                ))}
                            </Breadcrumbs>
                        </ActionBar.Group>
                        <ActionBar.Group pull="right">
                            {!hideThemeToggle && (
                                <ActionBar.Item className={b('header-actions')}>
                                    <SegmentedRadioGroup
                                        name="theme"
                                        defaultValue="light"
                                        value={theme}
                                        onChange={onThemeChange}
                                        options={[
                                            {
                                                value: 'light',
                                                content: <Icon data={Sun} />,
                                            },
                                            {
                                                value: 'dark',
                                                content: <Icon data={Moon} />,
                                            },
                                        ]}
                                    />
                                </ActionBar.Item>
                            )}
                        </ActionBar.Group>
                    </ActionBar.Section>
                </ActionBar>
                <Flex justifyContent={justify} className={b('content')}>
                    {children({justify})}
                </Flex>
            </Fragment>
        );
    };

    return (
        <ThemeProvider theme={theme} scoped rootClassName={`${b()} ${b({theme})}`}>
            {styles ? <style>{styles}</style> : null}

            <div
                className={b({
                    'hide-aside': hideAsideMenu,
                    'scrollable-content': scrollableContent,
                    'no-padding': noPadding,
                })}
                ref={containerRef}
            >
                <PortalProvider container={containerRef}>
                    <AsideHeader
                        menuItems={[
                            {
                                id: 'table',
                                title: 'Table',
                                icon: LayoutList,
                                iconSize: 18,
                                current: id === 'table',
                            },
                            {
                                id: 'form',
                                title: 'Form',
                                icon: SquareChartBar,
                                iconSize: 18,
                                current: id === 'form',
                            },
                            {
                                id: 'dashboard',
                                title: 'Dashboard',
                                icon: ChartAreaStackedNormalized,
                                iconSize: 18,
                                current: id === 'dashboard',
                            },
                            {
                                id: 'cards',
                                title: 'Cards',
                                icon: SquareBars,
                                iconSize: 18,
                                current: id === 'cards',
                            },
                        ]}
                        className={b('aside-header')}
                        logo={{
                            text: 'Gravity UI',
                            href: '#',
                            icon: gravityUi,
                            iconSize: 38,
                        }}
                        compact={isCompact}
                        onChangeCompact={setCompact}
                        renderContent={renderContent}
                        renderFooter={({compact}) => (
                            <React.Fragment>
                                <FooterItem
                                    id="user-settings"
                                    icon={Gear}
                                    title="User Settings"
                                    tooltipText="User Settings"
                                    onItemClick={() => {}}
                                    compact={compact}
                                />
                                <FooterItem
                                    id="user-account"
                                    title="User"
                                    itemWrapper={(p, makeItem) =>
                                        makeItem({...p, icon: <Person />})
                                    }
                                    compact={compact}
                                />
                            </React.Fragment>
                        )}
                    />
                </PortalProvider>
            </div>
        </ThemeProvider>
    );
};
