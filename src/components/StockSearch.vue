<template>
    <v-dialog
        transition="dialog-bottom-transition"
        max-width="600"
        :value="showDialog"
        @click:outside="closeDialog"
      >
        <template v-slot:default>
          <v-card>
            <v-toolbar
              color="primary"
              dark
            >
            <v-card-actions class="justify-right">
                <v-btn
                  text
                  @click="closeDialog"
                >Cancelar</v-btn>
              </v-card-actions>
            </v-toolbar>
			<v-skeleton-loader
				v-show="loading"
				class="mx-auto"
				type="text"
			/>
            <v-text-field
				v-show="!loading"
                label="Palabras Clave"
                :append-outer-icon="keywords? 'mdi-chevron-right':null"
				@click:append-outer="getSymbols"
                v-model="keywords"
                style="margin-left: 3rem; margin-right: 3rem; margin-top: 1rem;"
            />
			<v-skeleton-loader
				v-show="loading"
				class="mx-auto"
				type="table"
			/>
            <v-data-table
				v-show="!loading"
                :headers="headers"
                :items="stockList"
                :items-per-page="5"
                class="elevation-1">
				<template v-slot:item.actions="{ item }">
					<v-icon
						small
						class="mr-2"
						@click="selectStock(item)"
					>
						mdi-check
					</v-icon>
				</template>
			</v-data-table>
          </v-card>
        </template>
      </v-dialog>
</template>

<script>
export default {
    name: "StockSearch",
    props:{
        showDialog: {
            type: Boolean,
        },
    },
    data:()=>({
		keywords: null,
		loading: false,
        headers:[
            {
                text: 'Nombre',
                align: 'start',
                sortable: false,
                value: 'name',
            },
            {
                text: 'Zona',
                sortable: false,
                value: 'exchDisp',
			},
			{
				text: 'Simbolo', value: 'symbol',
			},
			{
				text: 'Opciones', value: 'actions', sortable: false
			}
        ],
        stockList: [],
    }),
    methods:{
        closeDialog: function () {
            this.$emit('close');
		},
		selectStock: function(item){
			this.$emit('select-stock', item);
		},

		getSymbols: async function(){
			let apiOptions = this.API_URL.YAHOO_LOW_LATENCY;
			let apiKey = apiOptions.api_key.find(item=>item.status);
			let urlParams = new URLSearchParams();
			urlParams.append('query', this.keywords);
			urlParams.append('lang', 'es');
			let apiURL = `${apiOptions.base}${apiOptions.autocomplete}?${urlParams.toString()}`;
			try{
				this.loading = true;
				let response = await fetch(apiURL, {
					"method": "GET",
					"headers": {
						"x-rapidapi-key": apiKey.key,
					}
				});
				let responseJson = await response.json();
				this.stockList = responseJson.ResultSet.Result;

			}catch(e){
				console.log(e);
			}finally{
				this.loading = false;
			}
			

		},
    },
    created: function () {
        let dummyData = `{
	"ResultSet": {
		"Query": "cemex",
		"Result": [
			{
				"symbol": "CX",
				"name": "CEMEX, S.A.B. de C.V.",
				"exch": "NYQ",
				"type": "S",
				"exchDisp": "NYSE",
				"typeDisp": "Acción"
			},
			{
				"symbol": "CEMEXCPO.MX",
				"name": "CEMEX, S.A.B. de C.V.",
				"exch": "MEX",
				"type": "S",
				"exchDisp": "México",
				"typeDisp": "Acción"
			},
			{
				"symbol": "CEXB.SG",
				"name": "Cemex S.A.B. de C.V. Ct.Ptg.O.n",
				"exch": "STU",
				"type": "S",
				"exchDisp": "Stuttgart",
				"typeDisp": "Acción"
			},
			{
				"symbol": "CXMSF",
				"name": "CEMEX, S.A.B. de C.V.",
				"exch": "PNK",
				"type": "S",
				"exchDisp": "OTC Markets",
				"typeDisp": "Acción"
			},
			{
				"symbol": "CEXA.F",
				"name": "CEMEX, S.A.B. de C.V.",
				"exch": "FRA",
				"type": "S",
				"exchDisp": "Frankfurt",
				"typeDisp": "Acción"
			},
			{
				"symbol": "CEXB.F",
				"name": "CEMEX, S.A.B. de C.V.",
				"exch": "FRA",
				"type": "S",
				"exchDisp": "Frankfurt",
				"typeDisp": "Acción"
			},
			{
				"symbol": "CEXA.BE",
				"name": "CEMEX SAB.CPO SP.ADR/10",
				"exch": "BER",
				"type": "S",
				"exchDisp": "Berlín",
				"typeDisp": "Acción"
			},
			{
				"symbol": "CEXA.MU",
				"name": "CEMEX SAB.CPO SP.ADR/10",
				"exch": "MUN",
				"type": "S",
				"exchDisp": "Munich",
				"typeDisp": "Acción"
			},
			{
				"symbol": "CX.BA",
				"name": "CEMEX SAB DE CV",
				"exch": "YHD",
				"type": "S",
				"exchDisp": "Industria",
				"typeDisp": "Acción"
			},
			{
				"symbol": "CEXA.SG",
				"name": "Cemex S.A.B. de C.V. Reg.CPO's ",
				"exch": "STU",
				"type": "S",
				"exchDisp": "Stuttgart",
				"typeDisp": "Acción"
			}
		]
	}
}`;

		let resultData = JSON.parse(dummyData);
		console.log(resultData)
        //this.stockList = resultData.ResultSet.Result;
    }
}
</script>