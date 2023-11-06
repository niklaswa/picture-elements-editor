interface Card {
    type: string;
}

interface PictureElementsCard extends Card {
    type: 'picture-elements'
    image: string;
    elements: PictureElement[];
}

interface PictureElement {
    type: string | 'state-badge' | 'state-icon' | 'state-label' | 'state-image' | 'service-button' | 'icon' | 'image';
    entity?: string;
    title?: string;
    icon?: string;
    tap_action?: Action;
    hold_action?: Action;
    double_tap_action?: Action;
    style?: Style;
    image?: string;
    state_image?: any;
}

interface Action {
    action: string;
    entity?: string;
    service?: string;
    service_data?: any;
    navigation_path?: string;
}

interface Style {
    [key: string]: string;
}



