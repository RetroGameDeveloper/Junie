import { IonButton, IonButtons, IonContent, IonHeader, IonItem, IonLabel, IonList, IonModal, IonPage, IonSelect, IonSelectOption, IonTitle, IonToolbar, useIonViewWillEnter } from '@ionic/react';
import { useState } from 'react';
import * as Cores from '../services/cores';
import * as Database from '../services/database';

const pascalify = (str) => {
    return str.replace(/([A-Z])([A-Z]+)/g, (_, c1, c2) => {
        return `${c1.toUpperCase()}${c2.toLowerCase()}`;
    });
}

const prettify = (lang, prefix) => {
    lang = lang.replace(prefix, '');

    const main = lang.split('_')[0];
    const sub = lang.split('_')[1];

    return pascalify(main) + (sub ? ` (${pascalify(sub)})` : '');
};

const EditModal = ({ open, dismiss, data }) => {

    return (
        <IonModal isOpen={open} backdropDismiss={false}>
            <IonHeader>
				<IonToolbar>
					<IonTitle>{data.name}</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={dismiss}>Close</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent class="modal">

                <IonList>
                    {data.items?.map(item =>
                        <IonItem key={item.key}>
                            <IonLabel>{item.name}</IonLabel>
                            <IonSelect interface="action-sheet" value={data.current[item.key]} onIonChange={e => data.update(item.key, e.detail.value)}>
                                <IonSelectOption value={null}>...</IonSelectOption>
                                {item.options?.map(option =>
                                    <IonSelectOption key={option.key} value={option.key}>{option.name}</IonSelectOption>
                                )}
                            </IonSelect>
                        </IonItem>
                    )}
                </IonList>

			</IonContent>
        </IonModal>
    );
}

export const SettingsPage = () => {

	const [modal, setModal] = useState(false);
    const [data, setData] = useState({});

	const [settings, setSettings] = useState({});
	const [languages, setLanguages] = useState([]);
	const [options, setOptions] = useState({});

	const language = async (lang) => {
        if (!settings.configurations)
            return;

        settings.language = lang;

        setSettings({ ...settings });

        await Database.updateSettings(settings);
    };

    const override = async (item, value) => {
        settings.configurations[item] = value;
        if (!value)
            delete settings.configurations[item];

        setSettings({ ...settings });

        await Database.updateSettings(settings);
    }

    const openModal = (name) => {
        const data =  { name: name };

        data.items = options[name].map(option => new Object({
			key: option.key,
			name: option.name,
			options: option.options.map(value => new Object({
				key: value,
				name: value
			})),
		}));
		data.current = settings.configurations;
		data.update = override;

        setData(data);
        setModal(true);
    }

    const closeModal = () => {
        setData({});
        setModal(false);
    }

	useIonViewWillEnter(async () => {
		setLanguages(await Cores.getLanguages());
		setOptions(await Cores.getSettings());
		setSettings(await Database.getSettings());
	});

	return (
		<IonPage>

			<IonHeader>
				<IonToolbar>
					<IonTitle>Settings</IonTitle>
				</IonToolbar>
			</IonHeader>

			<IonContent class="settings">

                <EditModal open={modal} dismiss={closeModal} data={data} />

                <IonList lines="full">

                    <IonItem key="languages">
                        <IonLabel>Language</IonLabel>
                        <IonSelect interface="action-sheet" value={settings.language} onIonChange={e => language(e.detail.value)}>
                            {languages.sort().map(name =>
                                <IonSelectOption key={name} value={name}>{prettify(name, 'RETRO_LANGUAGE_')}</IonSelectOption>
                            )}
                        </IonSelect>
                    </IonItem>

                    {Object.keys(options).map(name =>
                        <IonItem key={name} button onClick={() => openModal(name)}>
                            <IonLabel>{name}</IonLabel>
                        </IonItem>
                    )}

					<IonItem key="version" class="version">
                        <IonLabel>{window.junie_build}</IonLabel>
                    </IonItem>

                </IonList>
			</IonContent>

		</IonPage>
	);
};
