/********************************************************************************
 * Copyright (c) 2021, 2023 BMW Group AG
 * Copyright (c) 2021, 2023 Contributors to the Eclipse Foundation
 *
 * See the NOTICE file(s) distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Apache License, Version 2.0 which is available at
 * https://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/

import {
  Typography,
  IconButton,
  CardHorizontal,
  Card,
  LogoGrayData,
  SelectList,
  UploadFileStatus,
  UploadStatus,
} from 'cx-portal-shared-components'
import { useTranslation } from 'react-i18next'
import { Grid } from '@mui/material'
import { useState, useEffect, useMemo } from 'react'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import {
  useFetchUseCasesQuery,
  useFetchAppLanguagesQuery,
  useAddCreateAppMutation,
  useUpdateDocumentUploadMutation,
  useCasesItem,
  useFetchSalesManagerDataQuery,
  salesManagerType,
  useSaveAppMutation,
  useFetchAppStatusQuery,
  useFetchDocumentByIdMutation,
  DocumentTypeId,
} from 'features/appManagement/apiSlice'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { DropzoneFile } from 'components/shared/basic/Dropzone'
import '../ReleaseProcessSteps.scss'
import { useDispatch, useSelector } from 'react-redux'
import {
  appIdSelector,
  appStatusDataSelector,
  increment,
} from 'features/appManagement/slice'
import { setAppId, setAppStatus } from 'features/appManagement/actions'
import { isString } from 'lodash'
import Patterns from 'types/Patterns'
import uniqBy from 'lodash/uniqBy'
import SnackbarNotificationWithButtons from '../components/SnackbarNotificationWithButtons'
import { ConnectorFormInputField } from '../components/ConnectorFormInputField'
import CommonConnectorFormInputField from '../components/CommonConnectorFormInputField'
import ConnectorFormInputFieldShortAndLongDescription from '../components/ConnectorFormInputFieldShortAndLongDescription'
import ConnectorFormInputFieldImage from '../components/ConnectorFormInputFieldImage'
import ReleaseStepHeader from '../components/ReleaseStepHeader'

type FormDataType = {
  title: string
  provider: string
  shortDescriptionEN: string
  shortDescriptionDE: string
  useCaseCategory: string[] | useCasesItem[]
  appLanguage: string[]
  price: string
  uploadImage: {
    leadPictureUri: DropzoneFile | string | null
    alt?: string
  }
  salesManagerId: string | null
}

export default function AppMarketCard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const appId = useSelector(appIdSelector)
  const [pageScrolled, setPageScrolled] = useState(false)

  const useCasesListData = useFetchUseCasesQuery().data
  const useCasesList = useMemo(() => useCasesListData || [], [useCasesListData])

  const appLanguagesListData = useFetchAppLanguagesQuery().data
  const appLanguagesList = useMemo(
    () => appLanguagesListData || [],
    [appLanguagesListData]
  )

  const [addCreateApp] = useAddCreateAppMutation()
  const [saveApp] = useSaveAppMutation()
  const [updateDocumentUpload] = useUpdateDocumentUploadMutation()
  const [appCardNotification, setAppCardNotification] = useState(false)
  const [appCardSnackbar, setAppCardSnackbar] = useState<boolean>(false)
  const appStatusData = useSelector(appStatusDataSelector)
  const salesManagerList = useFetchSalesManagerDataQuery().data || []
  const [defaultSalesManagerValue, setDefaultSalesManagerValue] =
    useState<salesManagerType>({
      userId: null,
      firstName: 'none',
      lastName: '',
      fullName: 'none',
    })
  const [salesManagerListData, setSalesManagerListData] = useState<
    salesManagerType[]
  >([defaultSalesManagerValue])
  const [salesManagerId, setSalesManagerId] = useState<string | null>(null)
  const [fetchDocumentById] = useFetchDocumentByIdMutation()
  const [cardImage, setCardImage] = useState(LogoGrayData)
  const fetchAppStatus = useFetchAppStatusQuery(appId ?? '', {
    refetchOnMountOrArgChange: true,
  }).data
  const [defaultUseCaseVal, setDefaultUseCaseVal] = useState<any[]>([])
  const [defaultAppLanguageVal, setDefaultAppLanguageVal] = useState<any[]>([])

  const defaultValues = {
    title: appStatusData?.title,
    provider: appStatusData?.provider,
    price: appStatusData?.price,
    useCaseCategory: appStatusData?.useCase,
    appLanguage: appStatusData?.supportedLanguageCodes,
    salesManagerId: appStatusData?.salesManagerId,
    shortDescriptionEN:
      appStatusData?.descriptions?.filter(
        (appStatus: any) => appStatus.languageCode === 'en'
      )[0]?.shortDescription || '',
    shortDescriptionDE:
      appStatusData?.descriptions?.filter(
        (appStatus: any) => appStatus.languageCode === 'de'
      )[0]?.shortDescription || '',
    uploadImage: {
      leadPictureUri: cardImage === LogoGrayData ? null : cardImage,
      alt: appStatusData?.leadPictureUri || '',
    },
  }

  const {
    handleSubmit,
    getValues,
    control,
    trigger,
    setValue,
    formState: { errors, isValid },
    reset,
  } = useForm({
    defaultValues: defaultValues,
    mode: 'onChange',
  })

  useEffect(() => {
    if (useCasesList.length > 0) {
      const defaultUseCaseIds = useCasesList?.filter((item) =>
        appStatusData?.useCase?.some((x) => x === item.name)
      )
      setDefaultUseCaseVal(defaultUseCaseIds)
    }
    if (appLanguagesList.length > 0) {
      const defaultAppLanguages = appLanguagesList?.filter((item) =>
        appStatusData?.supportedLanguageCodes?.some(
          (x) => x === item.languageShortName
        )
      )
      setDefaultAppLanguageVal(defaultAppLanguages)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useCasesList, appStatusData, appLanguagesList])

  useEffect(() => {
    if (fetchAppStatus) dispatch(setAppStatus(fetchAppStatus))
  }, [dispatch, fetchAppStatus])

  useEffect(() => {
    if (salesManagerList.length > 0) {
      let data = salesManagerList?.map((item) => {
        return { ...item, fullName: `${item.firstName} ${item.lastName}` }
      })
      reset(defaultValues)
      const uniqueSalesManagerList = uniqBy(
        salesManagerListData.concat(data),
        'userId'
      )
      setSalesManagerListData(uniqueSalesManagerList)

      if (appStatusData?.salesManagerId) {
        const defaultsalesMgr: any = uniqueSalesManagerList?.filter(
          (item) => item.userId === appStatusData?.salesManagerId
        )
        onSalesManagerChange(defaultsalesMgr && defaultsalesMgr[0]?.userId)
        setDefaultSalesManagerValue(defaultsalesMgr && defaultsalesMgr[0])
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salesManagerList, appStatusData])

  const onSalesManagerChange = (sales: any) => {
    setSalesManagerId(sales)
  }

  const cardImageData: any = getValues().uploadImage.leadPictureUri
  useEffect(() => {
    if (cardImageData !== null && cardImageData !== LogoGrayData) {
      let isFile: any = cardImageData instanceof File

      if (isFile) {
        const blobFile = new Blob([cardImageData], {
          type: 'image/png',
        })
        setCardImage(URL.createObjectURL(blobFile))
      }
    }
  }, [cardImageData])

  useEffect(() => {
    if (
      appStatusData?.documents?.APP_LEADIMAGE &&
      appStatusData?.documents?.APP_LEADIMAGE[0].documentId
    ) {
      fetchCardImage(
        appStatusData?.documents?.APP_LEADIMAGE[0].documentId,
        appStatusData?.documents?.APP_LEADIMAGE[0].documentName
      )
    }
    reset(defaultValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appStatusData])

  const fetchCardImage = async (documentId: string, documentName: string) => {
    try {
      const response = await fetchDocumentById({ appId, documentId }).unwrap()
      const file = response.data

      const setFileStatus = (status: UploadFileStatus) =>
        setValue('uploadImage.leadPictureUri', {
          name: documentName,
          status,
        } as any)
      setFileStatus(UploadStatus.UPLOAD_SUCCESS)
      return setCardImage(URL.createObjectURL(file))
    } catch (error) {
      console.error(error, 'ERROR WHILE FETCHING IMAGE')
    }
  }

  const cardAppTitle =
    getValues().title ||
    t('content.apprelease.appMarketCard.defaultCardAppTitle')
  const cardAppProvider =
    getValues().provider ||
    t('content.apprelease.appMarketCard.defaultCardAppProvider')
  const cardDescription =
    getValues().shortDescriptionEN ||
    t('content.apprelease.appMarketCard.defaultCardShortDescriptionEN')
  const cardImageAlt =
    getValues().uploadImage.alt ||
    t('content.apprelease.appMarketCard.defaultCardAppImageAlt')

  window.onscroll = () => setPageScrolled(window.scrollY !== 0)

  const onSubmit = async (data: FormDataType, buttonLabel: string) => {
    const validateFields = await trigger([
      'title',
      'provider',
      'shortDescriptionEN',
      'shortDescriptionDE',
      'useCaseCategory',
      'price',
      'appLanguage',
      'uploadImage',
    ])
    if (validateFields) {
      handleSave(data, buttonLabel)
    }
  }

  const callDispatch = () => {
    if (fetchAppStatus) dispatch(setAppStatus(fetchAppStatus))
  }

  const onSave = (buttonLabel: string) => {
    buttonLabel === 'saveAndProceed' && dispatch(increment())
    buttonLabel === 'save' && setAppCardSnackbar(true)
  }

  const handleSave = async (data: FormDataType, buttonLabel: string) => {
    const saveData = {
      title: data.title,
      provider: data.provider,
      leadPictureUri:
        data.uploadImage.leadPictureUri !== null &&
        Object.keys(data.uploadImage.leadPictureUri).length > 0 &&
        Object.values(data.uploadImage.leadPictureUri)[0],
      salesManagerId: salesManagerId,
      useCaseIds: data.useCaseCategory,
      descriptions: [
        {
          languageCode: 'de',
          longDescription:
            appStatusData?.descriptions?.filter(
              (appStatus: any) => appStatus.languageCode === 'en'
            )[0]?.longDescription || '',
          shortDescription: data.shortDescriptionDE,
        },
        {
          languageCode: 'en',
          longDescription:
            appStatusData?.descriptions?.filter(
              (appStatus: any) => appStatus.languageCode === 'en'
            )[0]?.longDescription || '',
          shortDescription: data.shortDescriptionEN,
        },
      ],
      supportedLanguageCodes: data.appLanguage,
      price: data.price,
      privacyPolicies: [],
    }

    const uploadImageValue = getValues().uploadImage
      .leadPictureUri as unknown as DropzoneFile

    if (appId) {
      const saveAppData = {
        appId: appId,
        body: saveData,
      }

      await saveApp(saveAppData)
        .unwrap()
        .then(() => {
          dispatch(setAppId(appId))
          onSave(buttonLabel)
          callDispatch()
        })
        .catch(() => {
          setAppCardNotification(true)
        })
    } else {
      await addCreateApp(saveData)
        .unwrap()
        .then((result) => {
          if (isString(result)) {
            const setFileStatus = (status: UploadFileStatus) =>
              setValue('uploadImage.leadPictureUri', {
                name: uploadImageValue.name,
                size: uploadImageValue.size,
                status,
              } as any)

            setFileStatus(UploadStatus.UPLOADING)

            uploadDocumentApi(
              result,
              DocumentTypeId.APP_LEADIMAGE,
              uploadImageValue
            )
              .then(() => {
                setFileStatus(UploadStatus.UPLOAD_SUCCESS)
              })
              .catch(() => {
                setFileStatus(UploadStatus.UPLOAD_ERROR)
              })

            dispatch(setAppId(result))
            onSave(buttonLabel)
            callDispatch()
          }
        })
        .catch(() => {
          setAppCardNotification(true)
        })
    }
  }

  const uploadDocumentApi = async (
    appId: string,
    documentTypeId: string,
    file: any
  ) => {
    const data = {
      appId: appId,
      documentTypeId: documentTypeId,
      body: { file },
    }

    await updateDocumentUpload(data).unwrap()
  }

  return (
    <div className="app-market-card">
      <ReleaseStepHeader
        title={t('content.apprelease.appMarketCard.headerTitle')}
        description={t('content.apprelease.appMarketCard.headerDescription')}
      />
      <Grid container spacing={2}>
        {pageScrolled ? (
          <Grid item md={3} className={'app-release-card'}>
            <Card
              image={{
                src: cardImage,
                alt: cardImageAlt,
              }}
              title={cardAppTitle}
              subtitle={cardAppProvider}
              description={cardDescription}
              imageSize="normal"
              imageShape="square"
              variant="text-details"
              expandOnHover={false}
              filledBackground={true}
              buttonText={''}
              positionValue="sticky"
              topValue={50}
            />
          </Grid>
        ) : (
          <Grid item md={7} sx={{ mt: 0, mr: 'auto', mb: 10, ml: 'auto' }}>
            <CardHorizontal
              label={cardAppProvider || ''}
              title={cardAppTitle}
              imagePath={cardImage}
              imageAlt={cardImageAlt}
              borderRadius={0}
              description={cardDescription}
              backgroundColor="#F3F3F3"
            />
          </Grid>
        )}

        <Grid
          item
          md={8}
          sx={{ mt: 0, mr: 'auto', mb: 0, ml: pageScrolled ? 0 : 'auto' }}
        >
          <form>
            <CommonConnectorFormInputField
              {...{
                control,
                trigger,
                errors,
              }}
              name="title"
              pattern={Patterns.appMarketCard.appTitle}
              label={t('content.apprelease.appMarketCard.appTitle') + ' *'}
              rules={{
                required: `${t(
                  'content.apprelease.appMarketCard.appTitle'
                )} ${t('content.apprelease.appReleaseForm.isMandatory')}`,
                minLength: `${t(
                  'content.apprelease.appReleaseForm.minimum'
                )} 5 ${t(
                  'content.apprelease.appReleaseForm.charactersRequired'
                )}`,
                pattern: `${t(
                  'content.apprelease.appReleaseForm.validCharactersIncludes'
                )} A-Za-z0-9.:_- @&`,
                maxLength: `${t(
                  'content.apprelease.appReleaseForm.maximum'
                )} 40 ${t(
                  'content.apprelease.appReleaseForm.charactersAllowed'
                )}`,
              }}
            />
            <CommonConnectorFormInputField
              {...{
                control,
                trigger,
                errors,
              }}
              name="provider"
              maxLength={15}
              minLength={1}
              pattern={Patterns.appMarketCard.appProvider}
              label={t('content.apprelease.appMarketCard.appProvider') + ' *'}
              rules={{
                required: `${t(
                  'content.apprelease.appMarketCard.appProvider'
                )} ${t('content.apprelease.appReleaseForm.isMandatory')}`,
                minLength: `${t(
                  'content.apprelease.appReleaseForm.minimum'
                )} 5 ${t(
                  'content.apprelease.appReleaseForm.charactersRequired'
                )}`,
                pattern: `${t(
                  'content.apprelease.appReleaseForm.validCharactersIncludes'
                )} A-Za-z0-9.:_- @&`,
                maxLength: `${t(
                  'content.apprelease.appReleaseForm.maximum'
                )} 40 ${t(
                  'content.apprelease.appReleaseForm.charactersAllowed'
                )}`,
              }}
            />

            <div className="form-field">
              {['shortDescriptionEN', 'shortDescriptionDE'].map(
                (item: string, i) => (
                  <div key={item}>
                    <ConnectorFormInputFieldShortAndLongDescription
                      {...{
                        control,
                        trigger,
                        errors,
                        item,
                      }}
                      label={
                        <>
                          {t(`content.apprelease.appMarketCard.${item}`) + ' *'}
                          <IconButton sx={{ color: '#939393' }} size="small">
                            <HelpOutlineIcon />
                          </IconButton>
                        </>
                      }
                      value={
                        (item === 'shortDescriptionEN'
                          ? getValues().shortDescriptionEN.length
                          : getValues().shortDescriptionDE.length) + `/255`
                      }
                      patternKey="shortDescriptionEN"
                      patternEN={Patterns.appMarketCard.shortDescriptionEN}
                      patternDE={Patterns.appMarketCard.shortDescriptionDE}
                      rules={{
                        required: `${t(
                          `content.apprelease.appMarketCard.${item}`
                        )} ${t(
                          'content.apprelease.appReleaseForm.isMandatory'
                        )}`,
                        minLength: `${t(
                          'content.apprelease.appReleaseForm.minimum'
                        )} 10 ${t(
                          'content.apprelease.appReleaseForm.charactersRequired'
                        )}`,
                        pattern: `${t(
                          'content.apprelease.appReleaseForm.validCharactersIncludes'
                        )} ${
                          item === 'shortDescriptionEN'
                            ? `a-zA-Z0-9 !?@&#'"()_-=/*.,;:`
                            : `a-zA-ZÀ-ÿ0-9 !?@&#'"()_-=/*.,;:`
                        }`,
                        maxLength: `${t(
                          'content.apprelease.appReleaseForm.maximum'
                        )} 255 ${t(
                          'content.apprelease.appReleaseForm.charactersAllowed'
                        )}`,
                      }}
                    />
                  </div>
                )
              )}
            </div>

            <div className="form-field">
              <ConnectorFormInputField
                {...{
                  control,
                  trigger,
                  errors,
                  name: 'useCaseCategory',
                  label:
                    t('content.apprelease.appMarketCard.useCaseCategory') +
                    ' *',
                  placeholder: t(
                    'content.apprelease.appMarketCard.useCaseCategoryPlaceholder'
                  ),
                  type: 'multiSelectList',
                  rules: {
                    required: {
                      value: true,
                      message: `${t(
                        'content.apprelease.appMarketCard.useCaseCategory'
                      )} ${t('content.apprelease.appReleaseForm.isMandatory')}`,
                    },
                    pattern: {
                      value: Patterns.appMarketCard.useCaseCategory,
                      message: `${t(
                        'content.apprelease.appReleaseForm.validCharactersIncludes'
                      )} A-Za-z`,
                    },
                  },
                  items: useCasesList,
                  keyTitle: 'name',
                  saveKeyTitle: 'useCaseId',
                  notItemsText: t(
                    'content.apprelease.appReleaseForm.noItemsSelected'
                  ),
                  buttonAddMore: t('content.apprelease.appReleaseForm.addMore'),
                  defaultValues: defaultUseCaseVal,
                }}
              />
            </div>

            <div className="form-field">
              <ConnectorFormInputField
                {...{
                  control,
                  trigger,
                  errors,
                  name: 'appLanguage',
                  label:
                    t('content.apprelease.appMarketCard.appLanguage') + ' *',
                  placeholder: t(
                    'content.apprelease.appMarketCard.appLanguagePlaceholder'
                  ),
                  type: 'multiSelectList',
                  rules: {
                    required: {
                      value: true,
                      message: `${t(
                        'content.apprelease.appMarketCard.appLanguage'
                      )} ${t('content.apprelease.appReleaseForm.isMandatory')}`,
                    },
                    pattern: {
                      value: Patterns.appMarketCard.appLanguage,
                      message: `${t(
                        'content.apprelease.appReleaseForm.validCharactersIncludes'
                      )} A-Z a-z`,
                    },
                  },
                  items: appLanguagesList,
                  keyTitle: 'languageShortName',
                  saveKeyTitle: 'languageShortName',
                  notItemsText: t(
                    'content.apprelease.appReleaseForm.noItemsSelected'
                  ),
                  buttonAddMore: t('content.apprelease.appReleaseForm.addMore'),
                  filterOptionsArgs: {
                    matchFrom: 'any',
                    stringify: (option: any) =>
                      option.languageShortName +
                      option.languageLongNames.de +
                      option.languageLongNames.en,
                  },
                  defaultValues: defaultAppLanguageVal,
                }}
              />
            </div>

            <div className="form-field">
              <Typography
                sx={{ fontFamily: 'LibreFranklin-Medium' }}
                variant="subtitle2"
              >
                {t('content.apprelease.appMarketCard.salesManager')}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                {t('content.apprelease.appMarketCard.salesManagerDescription')}
              </Typography>
              <SelectList
                defaultValue={defaultSalesManagerValue}
                items={salesManagerListData}
                label={''}
                placeholder={t(
                  'content.apprelease.appMarketCard.salesManagerPlaceholder'
                )}
                onChangeItem={(e) => onSalesManagerChange(e.userId)}
                keyTitle={'fullName'}
              />
            </div>

            <CommonConnectorFormInputField
              {...{
                control,
                trigger,
                errors,
              }}
              name="price"
              pattern={Patterns.appMarketCard.pricingInformation}
              maxLength={15}
              minLength={1}
              label={
                t('content.apprelease.appMarketCard.pricingInformation') + ' *'
              }
              rules={{
                required: `${t(
                  'content.apprelease.appMarketCard.pricingInformation'
                )} ${t('content.apprelease.appReleaseForm.isMandatory')}`,
                minLength: `${t(
                  'content.apprelease.appReleaseForm.minimum'
                )} 1 ${t(
                  'content.apprelease.appReleaseForm.charactersRequired'
                )}`,
                pattern: `${t(
                  'content.apprelease.appReleaseForm.validCharactersIncludes'
                )} A-Za-z0-9/ €`,
                maxLength: `${t(
                  'content.apprelease.appReleaseForm.maximum'
                )} 15 ${t(
                  'content.apprelease.appReleaseForm.charactersAllowed'
                )}`,
              }}
            />

            <ConnectorFormInputFieldImage
              {...{
                control,
                trigger,
                errors,
              }}
              label={
                t('content.apprelease.appMarketCard.appLeadImageUpload') + ' *'
              }
              noteDescription={t(
                'content.apprelease.appReleaseForm.OnlyOneFileAllowed'
              )}
              note={t('content.apprelease.appReleaseForm.note')}
              requiredText={t(
                'content.apprelease.appReleaseForm.fileUploadIsMandatory'
              )}
            />
          </form>
        </Grid>
      </Grid>
      <SnackbarNotificationWithButtons
        pageNotification={appCardNotification}
        pageSnackbar={appCardSnackbar}
        pageSnackBarDescription={t(
          'content.apprelease.appReleaseForm.dataSavedSuccessMessage'
        )}
        pageNotificationsObject={{
          title: t('content.apprelease.appReleaseForm.error.title'),
          description: t('content.apprelease.appReleaseForm.error.message'),
        }}
        setPageNotification={() => setAppCardNotification(false)}
        setPageSnackbar={() => setAppCardSnackbar(false)}
        onBackIconClick={() => navigate('/appmanagement')}
        onSave={handleSubmit((data: any) => onSubmit(data, 'save'))}
        onSaveAndProceed={handleSubmit((data: any) =>
          onSubmit(data, 'saveAndProceed')
        )}
        isValid={isValid}
      />
    </div>
  )
}
