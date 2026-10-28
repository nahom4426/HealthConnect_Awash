# Features

One folder per insurance product (the eight entries in `src/stores/moduleStore.js`), plus `shared/` for code every product uses.

```
features/
  shared/        auth, profile, admin (users/roles/privileges), settings, analytics, form_builder
  health/        the ClaimConnect app: claim, underwriting, quotation, quotation_underwriting,
                 institutions, insured_persons, insured_service, providers, provider_contracts,
                 product_settings, authorization, finance
  motor/         rate config, quotations, proposals, and claims/ (the digital-channel claims flow)
  fire/          }
  marine/        }
  life/          }  dashboard + navs only so far
  engineering/   }
  liability/     }
  burglary/      }
```

Each product folder keeps its sidebar in `navs.js` and, inside each feature, the usual
`api/`, `components/`, `form/`, `modal/`, `pages/`, `store/` split.

Rules of thumb:

- Import across folders with the `@/features/...` alias, not `../../`, so a feature can move without breaking.
- A product's routes live in `src/router/<product>/`; shared ones in `src/router/shared/`.
- Code needed by two or more products goes in `shared/`, not in one product reaching into another.
